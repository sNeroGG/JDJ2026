import type { IncomingMessage, ServerResponse } from "node:http";
import { readRawBody, send } from "./_lib/http.js";
import { getDonation, updateDonation } from "./_lib/supabase.js";
import { verifyWompiWebhook, wompiHashHeader } from "./_lib/wompi.js";
import { isUuid } from "./_lib/safe.js";

type WompiWebhook = {
  IdTransaccion?: string;
  ResultadoTransaccion?: string;
  FormaPagoUtilizada?: string;
  ModuloUtilizado?: string;
  Monto?: number;
  EnlacePago?: { IdentificadorEnlaceComercio?: string };
};

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (req.method !== "POST") {
    send(res, 405, { error: "Método no permitido" });
    return;
  }

  try {
    const raw = await readRawBody(req);
    const headerHash = wompiHashHeader(req.headers);
    if (!verifyWompiWebhook(raw, headerHash)) {
      send(res, 401, { error: "Firma de Wompi no válida." });
      return;
    }

    const payload = JSON.parse(raw) as WompiWebhook;
    const id = String(payload.EnlacePago?.IdentificadorEnlaceComercio || "");
    if (!isUuid(id)) {
      send(res, 400, { error: "Identificador de donación no válido." });
      return;
    }

    const current = await getDonation(id);
    if (!current) {
      send(res, 404, { error: "Donación no encontrada." });
      return;
    }

    const approved = payload.ResultadoTransaccion === "ExitosaAprobada";
    const nextStatus = approved
      ? "paid"
      : current.status === "paid"
        ? "paid"
        : "failed";

    const donation = await updateDonation(id, {
      status: nextStatus,
      wompi_transaction_id: payload.IdTransaccion || current.wompi_transaction_id,
      payment_method:
        payload.FormaPagoUtilizada ||
        payload.ModuloUtilizado ||
        current.payment_method,
      paid_at: approved ? new Date().toISOString() : current.paid_at,
      raw_webhook: payload,
    });

    send(res, 200, { ok: true, donation });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error en el webhook.";
    send(res, 500, { error: message });
  }
}
