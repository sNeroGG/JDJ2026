import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { isAuthorized } from "./_lib/auth.js";
import { readBody, send, sendReadError } from "./_lib/http.js";
import { storeWhatsapp } from "./_lib/runtime.js";
import { insertDonation, listDonations, updateDonation } from "./_lib/supabase.js";
import {
  DONATION_PAYMENT,
  isDonationStatus,
  parseDonationInput,
  whatsappDonationUrl,
} from "../src/utils/donations.js";
import { clientKey, isUuid, rateLimit } from "./_lib/safe.js";

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

    if (req.method === "PATCH") {
      if (!isAuthorized(req)) {
        send(res, 401, { error: "No autorizado" });
        return;
      }
      const body = await readBody(req);
      const id = String(body.id || "");
      const status = String(body.status || "");
      if (!isUuid(id) || !isDonationStatus(status)) {
        send(res, 400, { error: "Donación o estado no válido." });
        return;
      }
      const donation = await updateDonation(id, {
        status,
        paid_at: status === "paid" ? new Date().toISOString() : null,
      });
      if (!donation) {
        send(res, 404, { error: "Donación no encontrada." });
        return;
      }
      send(res, 200, { ok: true, donation });
      return;
    }

    if (req.method !== "POST") {
      send(res, 405, { error: "Método no permitido" });
      return;
    }

    if (!rateLimit(`donate:${clientKey(req)}`, 8, 10 * 60 * 1000)) {
      send(res, 429, { error: "Demasiados intentos. Espera unos minutos." });
      return;
    }

    const parsed = parseDonationInput(await readBody(req));
    if ("error" in parsed) {
      send(res, 400, parsed);
      return;
    }

    const id = randomUUID();
    await insertDonation({
      id,
      full_name: parsed.fullName,
      dui: parsed.dui,
      email: parsed.email,
      phone: parsed.phone,
      parish: parsed.parish,
      amount: parsed.amount,
      status: "pending",
      payment_method: DONATION_PAYMENT,
    });

    send(res, 201, {
      ok: true,
      id,
      whatsappUrl: whatsappDonationUrl(storeWhatsapp(), {
        id,
        fullName: parsed.fullName,
        dui: parsed.dui,
        email: parsed.email,
        phone: parsed.phone,
        parish: parsed.parish,
        amount: parsed.amount,
      }),
    });
  } catch (error) {
    if (sendReadError(res, error)) return;
    const message =
      error instanceof Error ? error.message : "Error al registrar la donación.";
    send(res, 500, { error: message });
  }
}
