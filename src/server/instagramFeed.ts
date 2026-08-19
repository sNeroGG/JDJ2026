export type InstagramPost = {
  permalink: string;
  caption?: string;
};

export type InstagramFeedPayload = {
  handle: string;
  profileUrl: string;
  posts: InstagramPost[];
  profileHtml?: string;
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

export function postEmbedUrl(permalink: string) {
  const clean = String(permalink || "")
    .trim()
    .split("?")[0]
    .replace(/\/+$/, "");
  if (!clean) return "";
  return `${clean}/embed`;
}

function normalizePostUrl(value: string) {
  const clean = String(value || "")
    .trim()
    .split("?")[0]
    .replace(/\/+$/, "");
  if (!/^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels)\//i.test(clean)) {
    return "";
  }
  return `${clean}/`;
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
  const fields = "permalink,caption,media_type,timestamp";
  const endpoints = [
    `https://graph.instagram.com/v21.0/${encodeURIComponent(userId)}/media?fields=${fields}&limit=3&access_token=${encodeURIComponent(token)}`,
    `https://graph.facebook.com/v21.0/${encodeURIComponent(userId)}/media?fields=${fields}&limit=3&access_token=${encodeURIComponent(token)}`,
  ];

  for (const endpoint of endpoints) {
    const payload = await fetchJson(endpoint);
    const data = Array.isArray(payload?.data) ? payload.data : [];
    const posts = data
      .map((item) => {
        const row = item as { permalink?: string; caption?: string };
        const permalink = normalizePostUrl(String(row.permalink || ""));
        if (!permalink) return null;
        const caption = String(row.caption || "").trim();
        const post: InstagramPost = caption ? { permalink, caption } : { permalink };
        return post;
      })
      .filter((item): item is InstagramPost => item !== null);
    if (posts.length) return posts.slice(0, 3);
  }
  return [];
}

async function fetchProfileEmbed(handle: string) {
  const url = `${OEMBED}?url=${encodeURIComponent(profileUrlFor(handle))}&omitscript=true&hidecaption=false&maxwidth=400`;
  const payload = await fetchJson(url);
  const html = String(payload?.html || "").trim();
  return html || undefined;
}

export async function loadInstagramFeed(
  handle: string,
  fallbackPosts: string[] = [],
): Promise<InstagramFeedPayload> {
  const normalized = normalizeHandle(handle) || "pjarqui_ss";
  const cached = memory.get(normalized);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.payload;
  }

  const fromGraph = await fetchFromGraph();
  const fromAdmin = fallbackPosts
    .map(normalizePostUrl)
    .filter(Boolean)
    .slice(0, 3)
    .map((permalink) => ({ permalink }));
  const posts = (fromGraph.length ? fromGraph : fromAdmin).slice(0, 3);
  const profileHtml = posts.length
    ? undefined
    : await fetchProfileEmbed(normalized);

  const payload: InstagramFeedPayload = {
    handle: normalized,
    profileUrl: profileUrlFor(normalized),
    posts,
    profileHtml,
  };
  memory.set(normalized, { at: Date.now(), payload });
  return payload;
}
