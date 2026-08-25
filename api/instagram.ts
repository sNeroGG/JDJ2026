import type { IncomingMessage, ServerResponse } from "node:http";
import { SAVED_CONTENT } from "../src/data/savedContent.js";
import { loadInstagramFeed } from "../src/server/instagramFeed.js";
import { send } from "./_lib/http.js";
import { safeInstagramHandle } from "./_lib/safe.js";

function queryHandle(req: IncomingMessage) {
  try {
    const host = req.headers.host || "localhost";
    const url = new URL(req.url || "/", `http://${host}`);
    return safeInstagramHandle(url.searchParams.get("handle") || "");
  } catch {
    return "pjarqui_ss";
  }
}

function savedPosts() {
  const posts = (
    SAVED_CONTENT as {
      instagram?: { posts?: Array<string | { url?: string; imageUrl?: string }> };
    }
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
