function readEnv(name: string) {
  return String(process.env[name] || "").trim();
}

export function supabaseEnv() {
  const rawUrl = readEnv("SUPABASE_URL");
  const key =
    readEnv("SUPABASE_SERVICE_ROLE_KEY") || readEnv("SERVICE_ROLE_KEY");
  let url = rawUrl.replace(/\/+$/, "");
  const hadRestPath = /\/rest\/v1$/i.test(url);
  url = url.replace(/\/rest\/v1$/i, "").replace(/\/+$/, "");

  let host = "";
  try {
    if (url) host = new URL(url).host;
  } catch {
    host = "";
  }

  const hints: string[] = [];
  if (!rawUrl) {
    hints.push(
      "Falta SUPABASE_URL. En Vercel el nombre exacto es SUPABASE_URL y el valor es https://xxxx.supabase.co (sin /rest/v1).",
    );
  } else if (!host) {
    hints.push(
      "SUPABASE_URL no es válida. Debe ser https://xxxx.supabase.co sin /rest/v1.",
    );
  } else if (hadRestPath) {
    hints.push(
      "Se ignoró /rest/v1 al final de la URL. Deja solo https://xxxx.supabase.co.",
    );
  }
  if (!key) {
    hints.push(
      "Falta la clave. El nombre de la variable debe ser SUPABASE_SERVICE_ROLE_KEY (no SERVICE_ROLE_KEY) y el valor es la clave service_role, no la anon.",
    );
  }

  return {
    url,
    key,
    host,
    hasUrl: Boolean(url && host),
    hasKey: Boolean(key),
    hint: hints.join(" "),
  };
}

export function isSupabaseConfigured() {
  const env = supabaseEnv();
  return env.hasUrl && env.hasKey;
}
