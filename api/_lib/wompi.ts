import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";

type WompiToken = { access_token: string; expires_at: number };

let cachedToken: WompiToken | null = null;

function credentials() {
  const clientId = process.env.WOMPI_APP_ID || "";
  const clientSecret = process.env.WOMPI_API_SECRET || "";
  if (!clientId || !clientSecret) {
    throw new Error("Faltan WOMPI_APP_ID o WOMPI_API_SECRET en el servidor.");
  }
  return { clientId, clientSecret };
}

export function siteUrlFromRequest(req: { headers: IncomingHttpHeaders }) {
  const configured = (
    process.env.PUBLIC_SITE_URL ||
    process.env.VITE_SITE_URL ||
    ""
  ).replace(/\/+$/, "");
  if (configured) {
    return /^https?:\/\//i.test(configured)
      ? configured
      : `https://${configured}`;
  }
  const vercel = (
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    ""
  ).replace(/\/+$/, "");
  if (vercel) return `https://${vercel}`;
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "");
  const proto = String(req.headers["x-forwarded-proto"] || "https");
  return host ? `${proto}://${host}` : "";
}

async function accessToken() {
  const now = Date.now();
  if (cachedToken && cachedToken.expires_at > now + 30_000) {
    return cachedToken.access_token;
  }
  const { clientId, clientSecret } = credentials();
  const remote = await fetch("https://id.wompi.sv/connect/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      audience: "wompi_api",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const payload = (await remote.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
  };
  if (!remote.ok || !payload.access_token) {
    throw new Error(payload.error || "No se pudo autenticar con Wompi.");
  }
  cachedToken = {
    access_token: payload.access_token,
    expires_at: now + (payload.expires_in || 3600) * 1000,
  };
  return payload.access_token;
}

export async function createDonationLink(input: {
  reference: string;
  amount: number;
  siteUrl: string;
}) {
  const token = await accessToken();
  const remote = await fetch("https://api.wompi.sv/EnlacePago", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      identificadorEnlaceComercio: input.reference,
      monto: input.amount,
      nombreProducto: "Donación JDJ Jayaque 2026",
      formaPago: {
        permitirTarjetaCreditoDebido: true,
        permitirPagoConPuntoAgricola: true,
        permitirPagoEnCuotasAgricola: false,
        permitirPagoEnBitcoin: false,
        permitePagoQuickPay: false,
      },
      infoProducto: {
        descripcionProducto:
          "Aporte voluntario a la Jornada Diocesana de la Juventud. Monto fijo entre $5 y $25.",
      },
      configuracion: {
        urlRedirect: `${input.siteUrl}/donar/gracias?id=${encodeURIComponent(input.reference)}`,
        urlRetorno: `${input.siteUrl}/donar`,
        urlWebhook: `${input.siteUrl}/api/donations/webhook`,
        esMontoEditable: false,
        esCantidadEditable: false,
        notificarTransaccionCliente: true,
      },
      limitesDeUso: {
        cantidadMaximaPagosExitosos: 1,
      },
    }),
  });
  const payload = (await remote.json()) as {
    idEnlace?: number;
    urlEnlace?: string;
    title?: string;
    detail?: string;
  };
  if (!remote.ok || !payload.urlEnlace) {
    throw new Error(
      payload.detail || payload.title || "Wompi no generó el enlace de pago.",
    );
  }
  return { idEnlace: payload.idEnlace ?? null, urlEnlace: payload.urlEnlace };
}

export function wompiHashHeader(headers: IncomingHttpHeaders) {
  const raw =
    headers.wompi_hash ||
    headers["wompi-hash"] ||
    headers["Wompi-Hash"] ||
    headers["Wompi_Hash"];
  return String(Array.isArray(raw) ? raw[0] : raw || "").trim();
}

export function verifyWompiWebhook(rawBody: string, headerHash: string) {
  const secret = process.env.WOMPI_API_SECRET || "";
  if (!secret || !headerHash) return false;
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const given = Buffer.from(headerHash.toLowerCase());
  const expected = Buffer.from(digest);
  if (given.length !== expected.length) return false;
  return timingSafeEqual(given, expected);
}
