import type { IncomingMessage, ServerResponse } from "node:http";
import { send } from "./_lib/http.js";
import { persistKind, liveStockMap } from "./_lib/storeRepo.js";

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (req.method !== "GET") {
    send(res, 405, { error: "Método no permitido" });
    return;
  }
  try {
    send(res, 200, { stock: await liveStockMap(), persist: persistKind() });
  } catch (error) {
    send(res, 500, {
      error: error instanceof Error ? error.message : "Error en la tienda",
    });
  }
}
