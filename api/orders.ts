import type { IncomingMessage, ServerResponse } from "node:http";
import type { StoreOrder } from "../src/data/defaultContent.js";
import {
  buildMultiItemStoreOrder,
  buildStoreOrder,
  isProductComingSoon,
  parseCreateOrder,
  whatsappOrderUrl,
} from "../src/utils/store.js";
import { isAuthorized } from "./_lib/auth.js";
import { readBody, send, sendReadError } from "./_lib/http.js";
import { clientKey, isOrderId, rateLimit } from "./_lib/safe.js";
import { probeSupabase } from "./_lib/supabase.js";
import {
  deleteLiveOrder,
  liveProducts,
  persistKind,
  placeLiveMultiOrder,
  readOrders,
  StoreConflictError,
  storeWhatsapp,
  updateLiveOrderStatus,
} from "./_lib/storeRepo.js";

function wantsDbProbe(req: IncomingMessage) {
  const header = String(req.headers["x-jdj-probe"] || "");
  if (header === "1") return true;
  const query = (req as { query?: Record<string, unknown> }).query?.probe;
  if (query === "1" || (Array.isArray(query) && query[0] === "1")) return true;
  try {
    return (
      new URL(req.url || "/", "http://localhost").searchParams.get("probe") ===
      "1"
    );
  } catch {
    return false;
  }
}

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
      if (wantsDbProbe(req)) {
        try {
          send(res, 200, {
            ...(await probeSupabase()),
            persist: persistKind(),
          });
        } catch (error) {
          send(res, 200, {
            ok: false,
            persist: persistKind(),
            message:
              error instanceof Error
                ? error.message
                : "Fallo al consultar Supabase.",
            checks: [],
          });
        }
        return;
      }
      send(res, 200, {
        orders: await readOrders(),
        persist: persistKind(),
      });
      return;
    }

    if (req.method === "POST") {
      if (!rateLimit(`order:${clientKey(req)}`, 12, 10 * 60 * 1000)) {
        send(res, 429, { error: "Demasiados intentos. Espera unos minutos." });
        return;
      }
      const body = await readBody(req);
      const products = await liveProducts();
      let order: StoreOrder | { error: string };

      if (Array.isArray(body.items) && body.items.length > 0) {
        order = buildMultiItemStoreOrder(body as any, products);
      } else {
        const parsed = parseCreateOrder(body);
        if ("error" in parsed) {
          send(res, 400, parsed);
          return;
        }
        const product = products.find((item) => item.id === parsed.productId);
        if (!product) {
          send(res, 404, { error: "Producto no encontrado." });
          return;
        }
        if (isProductComingSoon(product)) {
          send(res, 409, { error: "Este producto aún no está disponible." });
          return;
        }
        order = buildStoreOrder(parsed, product);
      }

      if ("error" in order) {
        send(res, 409, order);
        return;
      }
      const placed = await placeLiveMultiOrder(order, products);
      if ("error" in placed) {
        send(res, 409, placed);
        return;
      }
      send(res, 201, {
        ok: true,
        order: placed.order,
        whatsappUrl: whatsappOrderUrl(storeWhatsapp(), placed.order),
      });
      return;
    }

    if (req.method === "PATCH") {
      if (!isAuthorized(req)) {
        send(res, 401, { error: "No autorizado" });
        return;
      }
      const body = await readBody(req);
      const id = String(body.id || "");
      const status = String(body.status || "") as StoreOrder["status"];
      if (
        !isOrderId(id) ||
        !["nuevo", "atendido", "cancelado"].includes(status)
      ) {
        send(res, 400, { error: "Pedido o estado no válido." });
        return;
      }
      const updated = await updateLiveOrderStatus(id, status);
      if ("error" in updated) {
        send(res, updated.http ?? 409, { error: updated.error });
        return;
      }
      send(res, 200, { ok: true, order: updated.order });
      return;
    }

    if (req.method === "DELETE") {
      if (!isAuthorized(req)) {
        send(res, 401, { error: "No autorizado" });
        return;
      }
      const body = await readBody(req);
      const id = String(body.id || "");
      if (!isOrderId(id)) {
        send(res, 400, { error: "ID de pedido no válido." });
        return;
      }
      const result = await deleteLiveOrder(id);
      if ("error" in result) {
        send(res, 404, { error: result.error });
        return;
      }
      send(res, 200, { ok: true });
      return;
    }


    send(res, 405, { error: "Método no permitido" });
  } catch (error) {
    if (sendReadError(res, error)) return;
    if (error instanceof StoreConflictError) {
      send(res, error.message === "Pedido no encontrado." ? 404 : 409, {
        error: error.message,
      });
      return;
    }
    send(res, 500, {
      error: error instanceof Error ? error.message : "Error en pedidos",
    });
  }
}
