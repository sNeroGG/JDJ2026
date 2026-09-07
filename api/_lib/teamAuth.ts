import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const DEFAULT_PASSWORD = "equipo2026";
const TOKEN_PREFIX = "jdjt1.";
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

/**
 * `TEAM_PASSWORD` / `TEAM_PIN` no llevan prefijo VITE_ a propósito: así nunca
 * viajan al bundle del navegador. En Vercel no se admite la clave por defecto.
 */
export function teamPassword() {
  const value = process.env.TEAM_PASSWORD || process.env.TEAM_PIN || "";
  if (process.env.VERCEL && (!value || value === DEFAULT_PASSWORD)) {
    return "";
  }
  return value || DEFAULT_PASSWORD;
}

function sign(payload: string) {
  return createHmac("sha256", teamPassword() || "unset")
    .update(payload)
    .digest("hex");
}

export function issueTeamToken() {
  const exp = Date.now() + TOKEN_TTL_MS;
  const nonce = randomBytes(8).toString("hex");
  const payload = `${exp}.${nonce}`;
  return `${TOKEN_PREFIX}${payload}.${sign(payload)}`;
}

export function matchesTeamPassword(candidate: string) {
  const expected = Buffer.from(teamPassword());
  const given = Buffer.from(candidate);
  if (!expected.length || given.length !== expected.length) return false;
  return timingSafeEqual(given, expected);
}
