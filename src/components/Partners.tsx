import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import "./Partners.css";

export function Partners() {
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const { partners } = content;
  const hasLogos = partners.logos.length > 0;

  return (
    <section className="section partners" id="auspiciadores" ref={ref}>
      <div className="section__inner partners__inner">
        <div className="partners__intro reveal">
          <p className="section__eyebrow">{partners.eyebrow}</p>
          <h2 className="section__title partners__title">{partners.title}</h2>
          <p className="section__lead partners__lead">{partners.lead}</p>
        </div>

        <div className="partners__grid">
          {hasLogos
            ? partners.logos.map((logo) => (
                <div key={logo.id} className="partners__slot partners__slot--filled">
                  <img
                    src={logo.src}
                    alt={logo.name}
                    width={220}
                    height={88}
                    decoding="async"
                    loading="lazy"
                  />
                  {logo.name ? (
                    <p className="partners__name">{logo.name}</p>
                  ) : null}
                </div>
              ))
            : Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`placeholder-${index}`}
                  className="partners__slot"
                  aria-label={`Espacio para logo ${index + 1}`}
                >
                  <span>Logo institucional {index + 1}</span>
                </div>
              ))}
        </div>

        <p className="partners__credit reveal reveal-delay-2">
          {partners.credit}
        </p>
      </div>
    </section>
  );
}
