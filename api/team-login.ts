import type { IncomingMessage, ServerResponse } from "node:http";
import { issueTeamToken, matchesTeamPassword } from "./_lib/teamAuth.js";
import { readBody, send, sendReadError } from "./_lib/http.js";
import { clientKey, rateLimit } from "./_lib/safe.js";

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (req.method !== "POST") {
    send(res, 405, { error: "Método no permitido" });
    return;
  }
  if (!rateLimit(`team-login:${clientKey(req)}`, 5, 15 * 60 * 1000)) {
    send(res, 429, { error: "Demasiados intentos. Espera unos minutos." });
    return;
  }
  try {
    const body = await readBody(req);
    const candidate = String(body.password || body.pin || "").trim();
    if (!matchesTeamPassword(candidate)) {
      send(res, 401, { error: "Clave incorrecta" });
      return;
    }
    send(res, 200, {
      ok: true,
      token: issueTeamToken(),
    });
  } catch (error) {
    if (sendReadError(res, error)) return;
    send(res, 400, { error: "Solicitud no válida" });
  }
}
