import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";

/**
 * `ADMIN_PASSWORD` no lleva prefijo VITE_ a propósito: así nunca viaja al bundle
 * del navegador. `VITE_ADMIN_PASSWORD` queda como respaldo para los despliegues
 * que todavía no migran la variable.
 */
export function adminPassword() {
  return (
    process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || "jdj2026"
  );
}

export function matchesAdminPassword(candidate: string) {
  const expected = Buffer.from(adminPassword());
  const given = Buffer.from(candidate);
  if (given.length !== expected.length) return false;
  return timingSafeEqual(given, expected);
}

export function bearerToken(req: IncomingMessage) {
  const header = String(req.headers.authorization || "");
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

export function isAuthorized(req: IncomingMessage) {
  return matchesAdminPassword(bearerToken(req));
}
