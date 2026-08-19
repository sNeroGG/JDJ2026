import { list, put } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const CONTENT_KEY = "jdj2026/content.json";

function adminPassword() {
  return process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || "jdj2026";
}

function isAuthorized(request: VercelRequest) {
  const header = request.headers.authorization || "";
  const token = header.replace(/^Bearer\s+/i, "");
  return token === adminPassword();
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method === "GET") {
    const { blobs } = await list({ prefix: CONTENT_KEY, limit: 1 });
    if (!blobs[0]) {
      return response.status(404).json({ error: "empty" });
    }
    const remote = await fetch(blobs[0].url);
    if (!remote.ok) {
      return response.status(404).json({ error: "empty" });
    }
    const json = await remote.json();
    return response.status(200).json(json);
  }

  if (request.method === "PUT") {
    if (!isAuthorized(request)) {
      return response.status(401).json({ error: "No autorizado" });
    }
    await put(CONTENT_KEY, JSON.stringify(request.body ?? {}), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return response.status(200).json({ ok: true });
  }

  response.setHeader("Allow", "GET, PUT");
  return response.status(405).end();
}
