import { useMemo } from "react";
import { useContent } from "../context/ContentContext";
import { parseInstagramPost } from "../utils/instagram";
import "./InstagramFeed.css";

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect
        x="3.2"
        y="3.2"
        width="17.6"
        height="17.6"
        rx="5.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle
        cx="12"
        cy="12"
        r="4.15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="17.35" cy="6.7" r="1.05" fill="currentColor" />
    </svg>
  );
}

export function InstagramFeed() {
  const { content } = useContent();
  const { instagram } = content;
  const handle = instagram.handle.replace(/^@/, "") || "pjarqui_ss";
  const profileUrl = `https://www.instagram.com/${handle}/`;
  const posts = useMemo(
    () => instagram.posts.filter((post) => post.url || post.imageUrl).slice(0, 3),
    [instagram.posts],
  );

  if (!instagram.enabled) return null;

  return (
    <div className="instagram-feed reveal" id="instagram">
      <div className="instagram-feed__intro">
        <div>
          <p className="section__eyebrow">{instagram.eyebrow}</p>
          <h3 className="instagram-feed__title">{instagram.title}</h3>
          {instagram.lead ? (
            <p className="instagram-feed__lead">{instagram.lead}</p>
          ) : null}
        </div>
        <a
          className="instagram-feed__follow"
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
        >
          <InstagramMark />
          <span>
            Seguir @{handle}
            <small>Pastoral Juvenil</small>
          </span>
        </a>
      </div>

      {posts.length > 0 ? (
        <div className="instagram-feed__grid" data-count={posts.length}>
          {posts.map((post, index) => {
            const href = post.url || profileUrl;
            const kind = parseInstagramPost(post.url)?.kind;
            return (
              <a
                className="instagram-feed__card"
                key={`${href}-${index}`}
                href={href}
                target="_blank"
                rel="noreferrer"
              >
                <div className="instagram-feed__meta">
                  {posts.length > 1 ? (
                    <span className="instagram-feed__index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  ) : (
                    <span className="instagram-feed__index">Destacada</span>
                  )}
                  <span className="instagram-feed__kind">
                    {kind === "reel" ? "Reel" : "Publicación"}
                  </span>
                </div>
                <div className="instagram-feed__photo">
                  {post.imageUrl ? (
                    <img src={post.imageUrl} alt="" />
                  ) : (
                    <div className="instagram-feed__placeholder">
                      <InstagramMark />
                    </div>
                  )}
                </div>
                <span className="instagram-feed__open">
                  Ver en Instagram
                  <span aria-hidden="true">↗</span>
                </span>
              </a>
            );
          })}
        </div>
      ) : (
        <a
          className="instagram-feed__card instagram-feed__card--profile"
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
        >
          <div className="instagram-feed__photo">
            <div className="instagram-feed__placeholder">
              <InstagramMark />
            </div>
          </div>
          <span className="instagram-feed__open">
            Ver perfil de @{handle}
            <span aria-hidden="true">↗</span>
          </span>
        </a>
      )}
    </div>
  );
}
