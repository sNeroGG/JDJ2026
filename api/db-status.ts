import type { IncomingMessage, ServerResponse } from "node:http";
import { isAuthorized } from "./_lib/auth.js";
import { send } from "./_lib/http.js";
import { probeSupabase, supabaseEnv } from "./_lib/supabase.js";

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
    send(res, 200, status);
  } catch (error) {
    const env = supabaseEnv();
    send(res, 200, {
      configured: false,
      ok: false,
      hasUrl: env.hasUrl,
      hasKey: env.hasKey,
      host: env.host || null,
      hint: env.hint,
      message:
        error instanceof Error
          ? error.message
          : "Fallo inesperado al consultar Supabase.",
      checks: [],
    });
  }
}
