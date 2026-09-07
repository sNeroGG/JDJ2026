import { SiteLink } from "./SiteLink";
import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import "./Catechesis.css";

export function Catechesis() {
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const { catechesis } = content;
  const comingSoon = catechesis.comingSoon;
  const count = catechesis.docs.length;

  return (
    <section className="section catechesis" id="catequesis" ref={ref}>
      <div className="section__inner">
        <div className="catechesis__intro reveal">
          <p className="section__eyebrow">{catechesis.eyebrow}</p>
          <h2 className="section__title">{catechesis.title}</h2>
          <p className="section__lead">{catechesis.lead}</p>
        </div>

        <div className="catechesis__teaser reveal reveal-delay-1">
          <span>Materiales</span>
          <h3>
            {comingSoon
              ? catechesis.comingSoonTitle
              : count > 0
                ? `${count} documento${count === 1 ? "" : "s"} listo${count === 1 ? "" : "s"} para descargar`
                : catechesis.emptyTitle}
          </h3>
          <p>
            {comingSoon
              ? catechesis.comingSoonText
              : count > 0
                ? "Entra a la página de catequesis para ver y abrir todos los documentos de preparación."
                : catechesis.emptyText}
          </p>
          <SiteLink className="catechesis__cta" href="/catequesis">
            {comingSoon ? "Ir a catequesis" : catechesis.ctaLabel}
            <span aria-hidden="true">→</span>
          </SiteLink>
        </div>
      </div>
    </section>
  );
}
