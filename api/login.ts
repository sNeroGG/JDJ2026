import type { IncomingMessage, ServerResponse } from "node:http";
import { issueAdminToken, matchesAdminPassword } from "./_lib/auth.js";
import { isGithubConfigured } from "./_lib/github.js";
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
  if (!rateLimit(`login:${clientKey(req)}`, 5, 15 * 60 * 1000)) {
    send(res, 429, { error: "Demasiados intentos. Espera unos minutos." });
    return;
  }
  try {
    const body = await readBody(req);
    if (!matchesAdminPassword(String(body.password || ""))) {
      send(res, 401, { error: "Contraseña incorrecta" });
      return;
    }
    send(res, 200, {
      ok: true,
      token: issueAdminToken(),
      canPublish: isGithubConfigured(),
    });
  } catch (error) {
    if (sendReadError(res, error)) return;
    send(res, 400, { error: "Solicitud no válida" });
  }
}
