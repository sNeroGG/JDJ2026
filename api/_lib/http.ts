import type { IncomingMessage, ServerResponse } from "node:http";

export const JSON_BODY_LIMIT = 64 * 1024;
export const CONTENT_BODY_LIMIT = 1024 * 1024;

export function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

export async function readRawBody(
  req: IncomingMessage & { body?: unknown; rawBody?: string },
  maxBytes = JSON_BODY_LIMIT,
) {
  if (typeof req.rawBody === "string") {
    if (Buffer.byteLength(req.rawBody) > maxBytes) {
      throw new PayloadTooLargeError();
    }
    return req.rawBody;
  }
  if (typeof req.body === "string") {
    if (Buffer.byteLength(req.body) > maxBytes) {
      throw new PayloadTooLargeError();
    }
    return req.body;
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > maxBytes) throw new PayloadTooLargeError();
    chunks.push(buf);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function readBody(
  req: IncomingMessage & { body?: unknown },
  maxBytes = JSON_BODY_LIMIT,
) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    const encoded = JSON.stringify(req.body);
    if (Buffer.byteLength(encoded) > maxBytes) {
      throw new PayloadTooLargeError();
    }
    return req.body as Record<string, unknown>;
  }
  const raw = await readRawBody(req, maxBytes);
  if (!raw) return {};
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("JSON inválido");
  }
  return parsed as Record<string, unknown>;
}

export class PayloadTooLargeError extends Error {
  constructor() {
    super("El envío es demasiado grande.");
    this.name = "PayloadTooLargeError";
  }
}

export function sendReadError(res: ServerResponse, error: unknown) {
  if (error instanceof PayloadTooLargeError) {
    send(res, 413, { error: error.message });
    return true;
  }
  if (error instanceof SyntaxError) {
    send(res, 400, { error: "Solicitud no válida" });
    return true;
  }
  return false;
}
