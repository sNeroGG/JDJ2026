import type { IncomingMessage, ServerResponse } from "node:http";
import type { StoreOrder } from "../src/data/defaultContent.ts";
import {
  buildStoreOrder,
  parseCreateOrder,
  whatsappOrderUrl,
} from "../src/utils/store.ts";
import {
  adjustStock,
  listProducts,
  persistKind,
  readOrders,
  storeWhatsapp,
  writeOrders,
} from "./_lib/runtime.ts";

const ADMIN_PASSWORD = process.env.VITE_ADMIN_PASSWORD || "jdj2026";

function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function isAuthorized(req: IncomingMessage) {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token === ADMIN_PASSWORD;
}

async function readBody(req: IncomingMessage & { body?: unknown }) {
  if (req.body && typeof req.body === "object") {
    return req.body as Record<string, unknown>;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
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
      const stock = adjustStock(product.id, -order.quantity);
      if ("error" in stock) {
        send(res, 409, stock);
        return;
      }
      writeOrders([...readOrders(), order]);
      send(res, 201, {
        ok: true,
        order,
        stock: stock.stock,
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
      if (current.status !== status) {
        if (status === "cancelado" && current.status !== "cancelado") {
          const restored = adjustStock(current.productId, current.quantity);
          if ("error" in restored) {
            send(res, 409, restored);
            return;
          }
        }
        if (current.status === "cancelado" && status !== "cancelado") {
          const taken = adjustStock(current.productId, -current.quantity);
          if ("error" in taken) {
            send(res, 409, taken);
            return;
          }
        }
      }
      orders[index] = { ...current, status };
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
