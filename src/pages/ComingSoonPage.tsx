import { useMemo } from "react";
import { Countdown } from "../components/Countdown";
import { useContent } from "../context/ContentContext";
import { useSeo } from "../hooks/useSeo";
import { revealAtDate } from "../utils/comingSoon";
import "./ComingSoonPage.css";

export function ComingSoonPage({
  onBackToInternal,
}: {
  onBackToInternal?: () => void;
} = {}) {
  const { content } = useContent();
  const revealAt = useMemo(() => revealAtDate(), []);

  useSeo({
    title: `Próximamente — ${content.site.pageTitle}`,
    description:
      "La Jornada Diocesana de la Juventud de la Arquidiócesis de San Salvador está por revelarse. Tengan valor y síganme.",
    path: "/",
    siteUrl: content.site.url,
    image: content.site.ogImage,
  });

  return (
    <div className="coming-soon">
      <header className="hero coming-soon__hero">
        <div className="hero__atmosphere" aria-hidden="true">
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

        <div className="hero__content coming-soon__content">
          <div className="hero__logo-wrap">
            <img
              className="hero__logo"
              src={content.logoUrl}
              alt="JDJ Jayaque 2026 — Arquidiócesis de San Salvador"
              width={1200}
              height={689}
              fetchPriority="high"
              decoding="sync"
            />
          </div>
          <p className="coming-soon__kicker">Próximamente</p>
          <p className="hero__slogan">{content.hero.slogan}</p>
          <p className="hero__tagline">{content.hero.tagline}</p>
          <Countdown
            target={revealAt}
            eyebrow="Cuenta regresiva"
            title="El sitio se revela en"
            doneText="Ha llegado el momento. En unos segundos se abre el sitio."
          />
        </div>
      </header>
      {onBackToInternal ? (
        <button
          type="button"
          className="coming-soon__back"
          onClick={onBackToInternal}
        >
          Volver a vista interna
        </button>
      ) : null}
    </div>
  );
}
