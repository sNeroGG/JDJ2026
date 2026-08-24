import type { IncomingMessage, ServerResponse } from "node:http";

export function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

export async function readRawBody(
  req: IncomingMessage & { body?: unknown; rawBody?: string },
) {
  if (typeof req.rawBody === "string") return req.rawBody;
  if (typeof req.body === "string") return req.body;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function readBody(req: IncomingMessage & { body?: unknown }) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>;
  }
  const raw = await readRawBody(req);
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}
