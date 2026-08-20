import {
  instagramPermalink,
  normalizeInstagramPosts,
} from "../utils/instagram.ts";

export type InstagramPost = {
  permalink: string;
  caption?: string;
  thumbnailUrl?: string;
};

export type InstagramFeedPayload = {
  handle: string;
  profileUrl: string;
  posts: InstagramPost[];
  source: "graph" | "admin";
};

const CACHE_MS = 15 * 60 * 1000;
const OEMBED =
  "https://graph.facebook.com/v25.0/instagram_oembed";

type CacheEntry = {
  at: number;
  payload: InstagramFeedPayload;
};

const memory = new Map<string, CacheEntry>();

export function normalizeHandle(value: string) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .replace(/\/+$/, "");
}

export function profileUrlFor(handle: string) {
  return `https://www.instagram.com/${normalizeHandle(handle)}/`;
}

function normalizePostUrl(value: string) {
  return instagramPermalink(value);
}

async function fetchJson(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const remote = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!remote.ok) return null;
    return (await remote.json()) as Record<string, unknown>;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFromGraph(): Promise<InstagramPost[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return [];
  const userId = process.env.INSTAGRAM_USER_ID || "me";
  const fields = "permalink,caption,media_type,timestamp,thumbnail_url,media_url";
  const endpoints = [
    `https://graph.instagram.com/v21.0/${encodeURIComponent(userId)}/media?fields=${fields}&limit=3&access_token=${encodeURIComponent(token)}`,
    `https://graph.facebook.com/v21.0/${encodeURIComponent(userId)}/media?fields=${fields}&limit=3&access_token=${encodeURIComponent(token)}`,
  ];

  for (const endpoint of endpoints) {
    const payload = await fetchJson(endpoint);
    const data = Array.isArray(payload?.data) ? payload.data : [];
    const posts = data
      .map((item) => {
        const row = item as {
          permalink?: string;
          caption?: string;
          thumbnail_url?: string;
          media_url?: string;
        };
        const permalink = normalizePostUrl(String(row.permalink || ""));
        if (!permalink) return null;
        const caption = String(row.caption || "").trim();
        const thumbnailUrl =
          String(row.thumbnail_url || row.media_url || "").trim() || undefined;
        const post: InstagramPost = {
          permalink,
          ...(caption ? { caption } : {}),
          ...(thumbnailUrl ? { thumbnailUrl } : {}),
        };
        return post;
      })
      .filter((item): item is InstagramPost => item !== null);
    if (posts.length) return posts.slice(0, 3);
  }
  return [];
}

async function attachPreview(post: InstagramPost): Promise<InstagramPost> {
  if (post.thumbnailUrl) return post;
  const url = `${OEMBED}?url=${encodeURIComponent(post.permalink)}&omitscript=true&hidecaption=true&maxwidth=400`;
  const payload = await fetchJson(url);
  const thumbnailUrl = String(payload?.thumbnail_url || "").trim();
  const title = String(payload?.title || "").trim();
  return {
    ...post,
    ...(thumbnailUrl ? { thumbnailUrl } : {}),
    ...(title && !post.caption ? { caption: title } : {}),
  };
}

export async function loadInstagramFeed(
  handle: string,
  fallbackPosts: Array<string | { url?: string; imageUrl?: string }> = [],
): Promise<InstagramFeedPayload> {
  const normalized = normalizeHandle(handle) || "pjarqui_ss";
  const cached = memory.get(normalized);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.payload;
  }

  const fromGraph = await fetchFromGraph();
  const fromAdmin = normalizeInstagramPosts(fallbackPosts).map((item) => ({
    permalink: item.url,
    thumbnailUrl: item.imageUrl || undefined,
  }));
  const raw = (fromGraph.length ? fromGraph : fromAdmin).slice(0, 3);
  const posts = await Promise.all(raw.map(attachPreview));

  const payload: InstagramFeedPayload = {
    handle: normalized,
    profileUrl: profileUrlFor(normalized),
    posts,
    source: fromGraph.length ? "graph" : "admin",
  };
  memory.set(normalized, { at: Date.now(), payload });
  return payload;
}
