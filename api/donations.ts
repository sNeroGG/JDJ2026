import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { isAuthorized } from "./_lib/auth.js";
import { readBody, send } from "./_lib/http.js";
import {
  getDonation,
  insertDonation,
  listDonations,
  updateDonation,
} from "./_lib/supabase.js";
import { createDonationLink, siteUrlFromRequest } from "./_lib/wompi.js";
import { parseDonationInput } from "../src/utils/donations.js";

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    if (req.method === "GET") {
      if (!isAuthorized(req)) {
        send(res, 401, { error: "No autorizado" });
        return;
      }
      const donations = await listDonations();
      const paid = donations.filter((item) => item.status === "paid");
      const totalPaid = paid.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      );
      send(res, 200, { donations, totalPaid, count: donations.length });
      return;
    }

    if (req.method !== "POST") {
      send(res, 405, { error: "Método no permitido" });
      return;
    }

    const parsed = parseDonationInput(await readBody(req));
    if ("error" in parsed) {
      send(res, 400, parsed);
      return;
    }

    const id = randomUUID();
    const siteUrl = siteUrlFromRequest(req);
    if (!siteUrl) {
      send(res, 500, {
        error: "Falta PUBLIC_SITE_URL para armar el retorno de Wompi.",
      });
      return;
    }

    await insertDonation({
      id,
      full_name: parsed.fullName,
      dui: parsed.dui,
      email: parsed.email,
      phone: parsed.phone,
      parish: parsed.parish,
      amount: parsed.amount,
      status: "pending",
    });

    try {
      const link = await createDonationLink({
        reference: id,
        amount: parsed.amount,
        siteUrl,
      });
      if (link.idEnlace != null) {
        await updateDonation(id, { wompi_enlace_id: link.idEnlace });
      }
      send(res, 201, {
        ok: true,
        id,
        redirectUrl: link.urlEnlace,
        donation: await getDonation(id),
      });
    } catch (error) {
      await updateDonation(id, { status: "failed" }).catch(() => undefined);
      const message =
        error instanceof Error ? error.message : "No se pudo abrir Wompi.";
      send(res, 502, { error: message });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al registrar la donación.";
    send(res, 500, { error: message });
  }
}
