import type { IncomingMessage, ServerResponse } from "node:http";
import type { StoreOrder } from "../src/data/defaultContent.js";
import {
  buildStoreOrder,
  parseCreateOrder,
  whatsappOrderUrl,
} from "../src/utils/store.js";
import { isAuthorized } from "./_lib/auth.js";
import { readBody, send } from "./_lib/http.js";
import {
  adjustStock,
  listProducts,
  persistKind,
  readOrders,
  resolveOrderVariantId,
  storeWhatsapp,
  writeOrders,
} from "./_lib/runtime.js";

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
      send(res, 200, {
        orders: readOrders().slice().reverse(),
        persist: persistKind(),
      });
      return;
    }

    if (req.method === "POST") {
      const parsed = parseCreateOrder(await readBody(req));
      if ("error" in parsed) {
        send(res, 400, parsed);
        return;
      }
      const product = listProducts().find((item) => item.id === parsed.productId);
      if (!product) {
        send(res, 404, { error: "Producto no encontrado." });
        return;
      }
      const order = buildStoreOrder(parsed, product);
      if ("error" in order) {
        send(res, 409, order);
        return;
      }
      const stock = adjustStock(product.id, order.variantId, -order.quantity);
      if ("error" in stock) {
        send(res, 409, stock);
        return;
      }
      writeOrders([...readOrders(), order]);
      send(res, 201, {
        ok: true,
        order,
        stock: stock.stock,
        total: stock.total,
        variantId: stock.variantId,
        whatsappUrl: whatsappOrderUrl(storeWhatsapp(), order),
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
      if (!id || !["nuevo", "atendido", "cancelado"].includes(status)) {
        send(res, 400, { error: "Pedido o estado no válido." });
        return;
      }
      const orders = readOrders();
      const index = orders.findIndex((item) => item.id === id);
      if (index < 0) {
        send(res, 404, { error: "Pedido no encontrado." });
        return;
      }
      const current = orders[index];
      const variantId = resolveOrderVariantId(current);
      if (current.status !== status && variantId) {
        if (status === "cancelado" && current.status !== "cancelado") {
          const restored = adjustStock(
            current.productId,
            variantId,
            current.quantity,
          );
          if ("error" in restored) {
            send(res, 409, restored);
            return;
          }
        }
        if (current.status === "cancelado" && status !== "cancelado") {
          const taken = adjustStock(
            current.productId,
            variantId,
            -current.quantity,
          );
          if ("error" in taken) {
            send(res, 409, taken);
            return;
          }
        }
      }
      orders[index] = { ...current, status, variantId: current.variantId || variantId };
      writeOrders(orders);
      send(res, 200, { ok: true, order: orders[index] });
      return;
    }

    send(res, 405, { error: "Método no permitido" });
  } catch (error) {
    send(res, 500, {
      error: error instanceof Error ? error.message : "Error en pedidos",
    });
  }
}
