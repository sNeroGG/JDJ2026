export type InstagramPostRef = {
  kind: "p" | "reel";
  shortcode: string;
};

export type InstagramHighlight = {
  url: string;
  imageUrl: string;
};

const POST_PATH =
  /instagram\.com\/(?:(?!p\/|reel\/|reels\/)[^/?#]+\/)?(p|reels?)\/([A-Za-z0-9_-]+)/i;

export function parseInstagramPost(value: string): InstagramPostRef | null {
  const match = String(value || "").trim().match(POST_PATH);
  if (!match) return null;
  const kind = match[1].toLowerCase().startsWith("reel") ? "reel" : "p";
  return { kind, shortcode: match[2] };
}

export function instagramPermalink(value: string) {
  const parsed = parseInstagramPost(value);
  if (!parsed) return "";
  return `https://www.instagram.com/${parsed.kind}/${parsed.shortcode}/`;
}

type InstagramPostInput =
  | string
  | {
      url?: string;
      imageUrl?: string;
    };

export function normalizeInstagramPosts(
  values: InstagramPostInput[],
): InstagramHighlight[] {
  const seen = new Set<string>();
  const posts: InstagramHighlight[] = [];
  for (const value of values) {
    const rawUrl = typeof value === "string" ? value : String(value?.url || "");
    const imageUrl =
      typeof value === "string" ? "" : String(value?.imageUrl || "").trim();
    const permalink = instagramPermalink(rawUrl) || rawUrl.trim();
    if (!permalink && !imageUrl) continue;
    if (permalink && seen.has(permalink)) continue;
    if (permalink) seen.add(permalink);
    posts.push({
      url: permalink,
      imageUrl: imageUrl.startsWith("data:") ? "" : imageUrl,
    });
    if (posts.length === 3) break;
  }
  return posts;
}
