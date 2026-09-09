import type { IncomingMessage, ServerResponse } from "node:http";
import { isAuthorized } from "./_lib/auth.js";
import { send } from "./_lib/http.js";
import { supabaseEnv } from "./_lib/supabaseEnv.js";

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

  const env = supabaseEnv();
  try {
    const { probeSupabase } = await import("./_lib/supabase.js");
    send(res, 200, {
      ...(await probeSupabase()),
      persist: env.hasUrl && env.hasKey ? "supabase" : "none",
    });
  } catch (error) {
    send(res, 200, {
      configured: env.hasUrl && env.hasKey,
      ok: false,
      hasUrl: env.hasUrl,
      hasKey: env.hasKey,
      host: env.host || null,
      hint: env.hint,
      persist: env.hasUrl && env.hasKey ? "supabase" : "none",
      message:
        error instanceof Error
          ? error.message
          : "La función no pudo cargar el cliente de Supabase.",
      checks: [],
    });
  }
}
