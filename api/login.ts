import type { IncomingMessage, ServerResponse } from "node:http";
import { matchesAdminPassword } from "./_lib/auth.js";
import { isGithubConfigured } from "./_lib/github.js";
import { readBody, send } from "./_lib/http.js";

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (req.method !== "POST") {
    send(res, 405, { error: "Método no permitido" });
    return;
  }
  try {
    const body = await readBody(req);
    if (!matchesAdminPassword(String(body.password || ""))) {
      send(res, 401, { error: "Contraseña incorrecta" });
      return;
    }
    send(res, 200, { ok: true, canPublish: isGithubConfigured() });
  } catch {
    send(res, 400, { error: "Solicitud no válida" });
  }
}
