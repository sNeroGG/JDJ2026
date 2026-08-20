import type { IncomingMessage, ServerResponse } from "node:http";
import { send } from "./_lib/http.js";
import { persistKind, stockMap } from "./_lib/runtime.js";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    send(res, 405, { error: "Método no permitido" });
    return;
  }
  send(res, 200, { stock: stockMap(), persist: persistKind() });
}
