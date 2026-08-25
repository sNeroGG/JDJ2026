import type { IncomingMessage } from "node:http";
import { isOrderId, isSafeId, isUuid } from "../../src/utils/ids.js";

export { isOrderId, isSafeId, isUuid };

const INSTAGRAM_HANDLE_RE = /^[A-Za-z0-9._]{1,30}$/;
const hits = new Map<string, { count: number; resetAt: number }>();

export function safeInstagramHandle(value: string, fallback = "pjarqui_ss") {
  const handle = String(value || "")
    .trim()
    .replace(/^@/, "")
    .replace(/\/+$/, "");
  return INSTAGRAM_HANDLE_RE.test(handle) ? handle : fallback;
}

export function clientKey(req: IncomingMessage) {
  const forwarded = String(req.headers["x-forwarded-for"] || "");
  const ip =
    forwarded.split(",")[0].trim() ||
    String(req.socket?.remoteAddress || "unknown");
  return ip.slice(0, 64);
}

export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= max) return false;
  current.count += 1;
  return true;
}

export function eqFilter(column: "id", value: string) {
  if (column !== "id" || !isUuid(value)) return "";
  return `id=eq.${encodeURIComponent(value)}`;
}
