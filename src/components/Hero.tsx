import { SiteLink } from "./SiteLink";
import { useContent } from "../context/ContentContext";
import { DEFAULT_CONTENT } from "../data/defaultContent";
import "./Hero.css";

export function Hero() {
  const { content, contentReady } = useContent();
  const { hero, logoUrl } = content;
  const showLogo = contentReady || logoUrl !== DEFAULT_CONTENT.logoUrl;

  return (
    <header className="hero" id="inicio">
      <div className="hero__atmosphere" aria-hidden="true">
        <div className="hero__sun" />
        <div className="hero__rays" />
        <div className="hero__hills">
          <span />
          <span />
          <span />
        </div>
        <div className="hero__beads">
          {Array.from({ length: 17 }).map((_, i) => (
            <i key={i} style={{ ["--i" as string]: i }} />
          ))}
        </div>
      </div>

      <div className="hero__content">
        {showLogo ? (
          <img
            className="hero__logo"
            src={logoUrl}
            alt="JDJ Jayaque 2026 — Arquidiócesis de San Salvador"
            width={720}
            height={420}
            fetchPriority="high"
            decoding="async"
          />
        ) : (
          <div className="hero__logo-slot" aria-hidden="true" />
        )}
        <p className="hero__slogan">{hero.slogan}</p>
        <p className="hero__tagline">{hero.tagline}</p>
        {hero.highlights?.length > 0 ? (
          <ul className="hero__highlights">
            {hero.highlights.map((item) => (
              <li key={item.id}>
                <SiteLink href={item.href}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </SiteLink>
              </li>
            ))}
          </ul>
        ) : null}
        <SiteLink className="hero__cta" href={hero.ctaHref}>
          {hero.ctaLabel}
          <span aria-hidden="true">↓</span>
        </SiteLink>
      </div>
    </header>
  );
}
