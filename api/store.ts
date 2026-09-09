import type { IncomingMessage, ServerResponse } from "node:http";
import { isAuthorized } from "./_lib/auth.js";
import { readBody, send, sendReadError } from "./_lib/http.js";
import { persistKind, liveStockMap, setLiveStock } from "./_lib/storeRepo.js";

function parseStockItems(body: Record<string, unknown>) {
  const raw = Array.isArray(body.items) ? body.items : [body];
  const items: { productId: string; variantId: string; stock: number }[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const entry = row as Record<string, unknown>;
    const productId = String(entry.productId || "").trim();
    const variantId = String(entry.variantId || "").trim();
    if (!productId || !variantId) continue;
    if (entry.stock == null || entry.stock === "") continue;
    const stock = Number(entry.stock);
    if (!Number.isFinite(stock)) continue;
    items.push({
      productId,
      variantId,
      stock: Math.max(0, Math.floor(stock)),
    });
  }
  return items;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    if (req.method === "GET") {
      send(res, 200, { stock: await liveStockMap(), persist: persistKind() });
      return;
    }

    if (req.method === "PATCH") {
      if (!isAuthorized(req)) {
        send(res, 401, { error: "No autorizado" });
        return;
      }
      const items = parseStockItems(await readBody(req));
      if (!items.length) {
        send(res, 400, { error: "Indica producto, variante y stock." });
        return;
      }
      const updated = await setLiveStock(items);
      if ("error" in updated) {
        send(res, 409, { error: updated.error });
        return;
      }
      send(res, 200, {
        ok: true,
        stock: updated.stock,
        persist: updated.persist,
      });
      return;
    }

    send(res, 405, { error: "Método no permitido" });
  } catch (error) {
    if (sendReadError(res, error)) return;
    send(res, 500, {
      error: error instanceof Error ? error.message : "Error en la tienda",
    });
  }
}
