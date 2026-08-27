import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import {
  activeSocialLinks,
  instagramHandleOf,
  instagramProfileUrl,
} from "../utils/social";
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

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M14.6 8.4V6.7c0-.85.5-1.3 1.55-1.3H17.5V3h-2.25C12.7 3 11 4.7 11 7.05v1.35H9v2.8h2V21h3.3v-9.8h2.35l.35-2.8z"
      />
    </svg>
  );
}

function YoutubeMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 5 12 5 12 5s-6 0-7.7.3a2.7 2.7 0 0 0-1.9 1.9A28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9C6 19 12 19 12 19s6 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8ZM10 15.2V8.8L15.5 12 10 15.2Z"
      />
    </svg>
  );
}

function TikTokMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M14.6 3.2c.35 2.35 1.7 4.05 4 4.55v2.55c-1.38.03-2.68-.4-4-1.22v6.55c0 3.48-2.85 6.15-6.45 5.85-2.85-.24-5.1-2.7-5.15-5.55-.05-3.25 2.6-5.95 5.9-5.95.35 0 .7.04 1.05.12v2.7c-.35-.14-.72-.22-1.1-.22-1.78.02-3.2 1.5-3.15 3.28.05 1.75 1.5 3.15 3.28 3.12 1.82 0 3.22-1.45 3.22-3.25V3.2h2.4Z"
      />
    </svg>
  );
}

const MARKS = {
  instagram: InstagramMark,
  facebook: FacebookMark,
  youtube: YoutubeMark,
  tiktok: TikTokMark,
} as const;

function followCopy(id: string, handle: string, name: string) {
  const label = handle.replace(/^@/, "") || name;
  if (id === "instagram") {
    return {
      title: handle ? `Seguir @${handle.replace(/^@/, "")}` : "Seguir en Instagram",
      subtitle: "Pastoral Juvenil",
    };
  }
  if (id === "facebook") {
    return { title: "Seguir en Facebook", subtitle: label };
  }
  if (id === "tiktok") {
    return {
      title: handle ? `Seguir @${handle.replace(/^@/, "")}` : "Seguir en TikTok",
      subtitle: label === handle.replace(/^@/, "") ? "Pastoral Juvenil" : label,
    };
  }
  return { title: "Seguir en YouTube", subtitle: label };
}

export function InstagramFeed() {
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const { instagram, footer } = content;
  const networks = activeSocialLinks(footer.social).map((item) => {
    if (item.id !== "instagram") return item;
    const handle = instagramHandleOf(footer.social, instagram.handle);
    return {
      ...item,
      handle,
      href: item.href.trim() || instagramProfileUrl(handle),
    };
  }).filter((item) => item.href.trim());

  if (!instagram.enabled || !networks.length) return null;

  return (
    <section className="section instagram-follow" id="instagram" ref={ref}>
      <div className="section__inner instagram-follow__inner reveal">
        {instagram.lead ? (
          <p className="instagram-follow__lead">{instagram.lead}</p>
        ) : null}
        <div className="instagram-follow__actions">
          {networks.map((item) => {
            const Mark = MARKS[item.id as keyof typeof MARKS];
            const copy = followCopy(item.id, item.handle, item.name);
            return (
              <a
                key={item.id}
                className={`instagram-feed__follow instagram-feed__follow--${item.id}`}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={copy.title}
              >
                {Mark ? <Mark /> : null}
                <span>
                  <strong className="instagram-feed__follow-title">
                    {copy.title}
                  </strong>
                  <strong className="instagram-feed__follow-name">
                    {item.name}
                  </strong>
                  <small>{copy.subtitle}</small>
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
