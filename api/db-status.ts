import type { IncomingMessage, ServerResponse } from "node:http";
import { isAuthorized } from "./_lib/auth.js";
import { send } from "./_lib/http.js";
import { probeSupabase } from "./_lib/supabase.js";

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (req.method !== "GET") {
    send(res, 405, { error: "Método no permitido" });
    return;
  }
  if (!isAuthorized(req)) {
    send(res, 401, { error: "No autorizado" });
    return;
  }
  try {
    const status = await probeSupabase();
    send(res, status.ok ? 200 : 503, status);
  } catch (error) {
    send(res, 503, {
      configured: false,
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo consultar la base de datos.",
      checks: [],
    });
  }
}
