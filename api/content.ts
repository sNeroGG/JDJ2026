import { list, put } from "@vercel/blob";

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
  const { blobs } = await list({ prefix: CONTENT_KEY, limit: 1 });
  if (!blobs[0]) {
    return json({ error: "empty" }, 404);
  }
  const remote = await fetch(blobs[0].url);
  if (!remote.ok) {
    return json({ error: "empty" }, 404);
  }
  return json(await remote.json());
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) {
    return json({ error: "No autorizado" }, 401);
  }
  const body = await request.json().catch(() => ({}));
  await put(CONTENT_KEY, JSON.stringify(body ?? {}), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  return json({ ok: true });
}
