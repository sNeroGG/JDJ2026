import { useEffect, useMemo, useState } from "react";
import { useContent } from "../context/ContentContext";
import "./InstagramFeed.css";

type FeedPost = { permalink: string; caption?: string };

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

function embedSrc(permalink: string) {
  return `${permalink.replace(/\/+$/, "")}/embed`;
}

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle
        cx="12"
        cy="12"
        r="4.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="17.2" cy="6.8" r="1.05" fill="currentColor" />
    </svg>
  );
}

export function InstagramFeed() {
  const { content } = useContent();
  const { instagram } = content;
  const [livePosts, setLivePosts] = useState<FeedPost[] | null>(null);
  const [profileHtml, setProfileHtml] = useState("");

  useEffect(() => {
    if (!instagram.enabled) return;
    const handle = encodeURIComponent(instagram.handle || "pjarqui_ss");
    void fetch(`/api/instagram?handle=${handle}`)
      .then(async (remote) => {
        if (!remote.ok) return;
        const payload = (await remote.json()) as {
          posts?: FeedPost[];
          profileHtml?: string;
        };
        if (payload.posts?.length) setLivePosts(payload.posts);
        if (payload.profileHtml) setProfileHtml(payload.profileHtml);
      })
      .catch(() => undefined);
  }, [instagram.enabled, instagram.handle]);

  useEffect(() => {
    if (!profileHtml) return;

    function processEmbeds() {
      window.instgrm?.Embeds.process();
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.instagram.com/embed.js"]',
    );
    if (window.instgrm) {
      processEmbeds();
      return;
    }
    if (existing) {
      existing.addEventListener("load", processEmbeds);
      return () => existing.removeEventListener("load", processEmbeds);
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.instagram.com/embed.js";
    script.onload = processEmbeds;
    document.body.appendChild(script);
  }, [profileHtml]);

  const posts = useMemo((): FeedPost[] => {
    if (livePosts?.length) return livePosts.slice(0, 3);
    return instagram.posts
      .filter(Boolean)
      .slice(0, 3)
      .map((permalink) => ({ permalink }));
  }, [instagram.posts, livePosts]);

  if (!instagram.enabled) return null;

  const handle = instagram.handle.replace(/^@/, "") || "pjarqui_ss";
  const profileUrl = `https://www.instagram.com/${handle}/`;

  return (
    <div className="instagram-feed reveal" id="instagram">
      <div className="instagram-feed__intro">
        <p className="section__eyebrow">{instagram.eyebrow}</p>
        <h3 className="instagram-feed__title">{instagram.title}</h3>
        {instagram.lead ? (
          <p className="instagram-feed__lead">{instagram.lead}</p>
        ) : null}
        <a
          className="instagram-feed__handle"
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
        >
          <InstagramMark />
          @{handle}
        </a>
      </div>

      {posts.length > 0 ? (
        <div className="instagram-feed__grid">
          {posts.map((post) => (
            <article className="instagram-feed__card" key={post.permalink}>
              <iframe
                title={post.caption || `Publicación de @${handle}`}
                src={embedSrc(post.permalink)}
                loading="lazy"
                allow="encrypted-media; picture-in-picture"
                scrolling="no"
              />
            </article>
          ))}
        </div>
      ) : profileHtml ? (
        <div
          className="instagram-feed__profile"
          dangerouslySetInnerHTML={{ __html: profileHtml }}
        />
      ) : (
        <div className="instagram-feed__fallback">
          <a href={profileUrl} target="_blank" rel="noreferrer">
            Ver las publicaciones de @{handle} en Instagram
          </a>
        </div>
      )}
    </div>
  );
}
