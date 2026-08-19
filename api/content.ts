import { get, put } from "@vercel/blob";

const CONTENT_KEY = "jdj2026/content.json";

function adminPassword() {
  return process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || "jdj2026";
}

function isAuthorized(request: Request) {
  const token = (request.headers.get("authorization") || "").replace(
    /^Bearer\s+/i,
    "",
  );
  return token === adminPassword();
}

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET() {
  try {
    const result = await get(CONTENT_KEY, { access: "private" });
    if (result.statusCode !== 200 || !result.stream) {
      return json({ error: "empty" }, 404);
    }
    const text = await new Response(result.stream).text();
    return json(JSON.parse(text) as unknown);
  } catch {
    return json({ error: "empty" }, 404);
  }
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) {
    return json({ error: "No autorizado" }, 401);
  }
  const body = await request.json().catch(() => ({}));
  await put(CONTENT_KEY, JSON.stringify(body ?? {}), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  return json({ ok: true });
}
