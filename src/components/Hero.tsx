import { useContent } from "../context/ContentContext";
import "./Hero.css";

export function Hero() {
  const { content } = useContent();
  const { hero, logoUrl } = content;

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
        <img
          className="hero__logo"
          src={logoUrl}
          alt="JDJ Jayaque 2026 — Arquidiócesis de San Salvador"
          width={720}
          height={420}
        />
        <p className="hero__slogan">{hero.slogan}</p>
        <p className="hero__tagline">{hero.tagline}</p>
        <a className="hero__cta" href={hero.ctaHref}>
          {hero.ctaLabel}
          <span aria-hidden="true">↓</span>
        </a>
      </div>
    </header>
  );
}
