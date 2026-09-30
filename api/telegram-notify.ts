import type { IncomingMessage, ServerResponse } from "node:http";
import { isAuthorized } from "./_lib/auth.js";
import { readBody, send, sendReadError } from "./_lib/http.js";
import { readOrders } from "./_lib/storeRepo.js";
import { listDonations } from "./_lib/supabase.js";
import {
  sendTelegramDonationNotification,
  sendTelegramOrderNotification,
} from "./_lib/telegram.js";

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    if (req.method !== "POST") {
      send(res, 405, { error: "Método no permitido" });
      return;
    }
    if (!isAuthorized(req)) {
      send(res, 401, { error: "No autorizado" });
      return;
    }

    const body = await readBody(req);
    const type = String(body.type || "");
    const id = String(body.id || "");

    if (!id || (type !== "order" && type !== "donation")) {
      send(res, 400, { error: "Parámetros inválidos." });
      return;
    }

    if (type === "order") {
      const orders = await readOrders();
      const order = orders.find((o) => o.id === id);
      if (!order) {
        send(res, 404, { error: "Pedido no encontrado." });
        return;
      }
      const ok = await sendTelegramOrderNotification(order);
      if (!ok) {
        send(res, 500, {
          error:
            "No se pudo enviar el pedido a Telegram. Verifica TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID.",
        });
        return;
      }
      send(res, 200, {
        ok: true,
        message: "Pedido enviado exitosamente a Telegram.",
      });
      return;
    }

    if (type === "donation") {
      const donations = await listDonations();
      const donation = donations.find((d) => d.id === id);
      if (!donation) {
        send(res, 404, { error: "Donación no encontrada." });
        return;
      }
      const ok = await sendTelegramDonationNotification({
        id: donation.id,
        fullName: donation.full_name,
        dui: donation.dui || "",
        email: donation.email,
        phone: donation.phone,
        parish: donation.parish,
        amount: Number(donation.amount),
        createdAt: donation.created_at,
      });
      if (!ok) {
        send(res, 500, {
          error:
            "No se pudo enviar la donación a Telegram. Verifica TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID.",
        });
        return;
      }
      send(res, 200, {
        ok: true,
        message: "Donación enviada exitosamente a Telegram.",
      });
      return;
    }
  } catch (error) {
    if (sendReadError(res, error)) return;
    send(res, 500, {
      error:
        error instanceof Error
          ? error.message
          : "Error al notificar a Telegram",
    });
  }
}
