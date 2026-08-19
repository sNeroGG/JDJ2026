import type { IncomingMessage, ServerResponse } from "node:http";
import {
  persistKind,
  stockMap,
} from "./_lib/runtime.ts";

function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    send(res, 405, { error: "Método no permitido" });
    return;
  }
  send(res, 200, { stock: stockMap(), persist: persistKind() });
}
