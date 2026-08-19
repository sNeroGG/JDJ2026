import type { IncomingMessage, ServerResponse } from "node:http";
import { SAVED_CONTENT } from "../src/data/savedContent.ts";
import { loadInstagramFeed } from "../src/server/instagramFeed.ts";

function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.end(JSON.stringify(data));
}

function queryHandle(req: IncomingMessage) {
  try {
    const host = req.headers.host || "localhost";
    const url = new URL(req.url || "/", `http://${host}`);
    return url.searchParams.get("handle") || "pjarqui_ss";
  } catch {
    return "pjarqui_ss";
  }
}

function savedPosts() {
  const posts = (
    SAVED_CONTENT as { instagram?: { posts?: string[] } }
  ).instagram?.posts;
  return Array.isArray(posts) ? posts : [];
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (req.method !== "GET") {
    send(res, 405, { error: "Método no permitido" });
    return;
  }
  try {
    const feed = await loadInstagramFeed(queryHandle(req), savedPosts());
    send(res, 200, feed);
  } catch (error) {
    send(res, 500, {
      error:
        error instanceof Error ? error.message : "No se pudo cargar Instagram",
    });
  }
}
