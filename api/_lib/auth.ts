import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";

const DEFAULT_PASSWORD = "jdj2026";
const TOKEN_PREFIX = "jdj1.";
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

/**
 * `ADMIN_PASSWORD` no lleva prefijo VITE_ a propósito: así nunca viaja al bundle
 * del navegador. `VITE_ADMIN_PASSWORD` queda como respaldo para los despliegues
 * que todavía no migran la variable.
 * En Vercel no se admite la clave por defecto.
 */
export function adminPassword() {
  const value =
    process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || "";
  if (process.env.VERCEL && (!value || value === DEFAULT_PASSWORD)) {
    return "";
  }
  return value || DEFAULT_PASSWORD;
}

function sign(payload: string) {
  return createHmac("sha256", adminPassword() || "unset")
    .update(payload)
    .digest("hex");
}

export function issueAdminToken() {
  const exp = Date.now() + TOKEN_TTL_MS;
  const nonce = randomBytes(8).toString("hex");
  const payload = `${exp}.${nonce}`;
  return `${TOKEN_PREFIX}${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token: string) {
  if (!adminPassword() || !token.startsWith(TOKEN_PREFIX)) return false;
  const rest = token.slice(TOKEN_PREFIX.length);
  const lastDot = rest.lastIndexOf(".");
  if (lastDot < 1) return false;
  const payload = rest.slice(0, lastDot);
  const given = Buffer.from(rest.slice(lastDot + 1));
  const expected = Buffer.from(sign(payload));
  if (given.length !== expected.length) return false;
  if (!timingSafeEqual(given, expected)) return false;
  const exp = Number(payload.split(".")[0]);
  return Number.isFinite(exp) && exp > Date.now();
}

export function matchesAdminPassword(candidate: string) {
  const expected = Buffer.from(adminPassword());
  const given = Buffer.from(candidate);
  if (!expected.length || given.length !== expected.length) return false;
  return timingSafeEqual(given, expected);
}

export function bearerToken(req: IncomingMessage) {
  const header = String(req.headers.authorization || "");
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

export function isAuthorized(req: IncomingMessage) {
  const token = bearerToken(req);
  if (!token) return false;
  return verifyAdminToken(token) || matchesAdminPassword(token);
}
