import type { SocialLink } from "../data/defaultContent";

export const SOCIAL_NETWORKS = [
  {
    id: "instagram",
    name: "Instagram",
    handlePlaceholder: "@pjarqui_ss",
    hrefPlaceholder: "https://www.instagram.com/pjarqui_ss/",
  },
  {
    id: "facebook",
    name: "Facebook",
    handlePlaceholder: "Pastoral Juvenil",
    hrefPlaceholder: "https://www.facebook.com/pjarquiss",
  },
  {
    id: "youtube",
    name: "YouTube",
    handlePlaceholder: "Canal",
    hrefPlaceholder: "https://www.youtube.com/@…",
  },
  {
    id: "tiktok",
    name: "TikTok",
    handlePlaceholder: "@cuenta",
    hrefPlaceholder: "https://www.tiktok.com/@…",
  },
] as const;

export function withSocialDefaults(social: SocialLink[] = []): SocialLink[] {
  return SOCIAL_NETWORKS.map((network) => {
    const found = social.find((item) => item.id === network.id);
    return {
      id: network.id,
      name: found?.name || network.name,
      handle: found?.handle || "",
      href: found?.href || "",
    };
  });
}

export function activeSocialLinks(social: SocialLink[] = []) {
  return withSocialDefaults(social).filter((item) => item.href.trim());
}

export function instagramHandleOf(social: SocialLink[], fallback = "") {
  const ig = withSocialDefaults(social).find((item) => item.id === "instagram");
  const fromHandle = ig?.handle.replace(/^@/, "").trim();
  if (fromHandle) return fromHandle;
  const fromUrl = ig?.href.match(/instagram\.com\/([^/?#]+)/i)?.[1];
  if (fromUrl && fromUrl !== "p" && fromUrl !== "reel" && fromUrl !== "reels") {
    return fromUrl.replace(/^@/, "");
  }
  return fallback.replace(/^@/, "");
}

export function instagramProfileUrl(handle: string) {
  const clean = handle.replace(/^@/, "").trim();
  return clean ? `https://www.instagram.com/${clean}/` : "";
}
