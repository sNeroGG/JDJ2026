import { useReveal } from "../hooks/useReveal";
import "./Partners.css";

const PLACEHOLDERS = [
  "Logo institucional 1",
  "Logo institucional 2",
  "Logo institucional 3",
  "Logo institucional 4",
] as const;

export function Partners() {
  const ref = useReveal<HTMLElement>();

  return (
    <section className="section partners" id="auspiciadores" ref={ref}>
      <div className="section__inner partners__inner">
        <div className="partners__intro reveal">
          <p className="section__eyebrow">Acompañan</p>
          <h2 className="section__title partners__title">
            Logos institucionales
          </h2>
          <p className="section__lead partners__lead">
            Espacio reservado para los logos que has de proporcionar,
            creados por la Arquidiócesis de San Salvador, El Salvador.
          </p>
        </div>

        <div className="partners__grid reveal reveal-delay-1">
          {PLACEHOLDERS.map((label) => (
            <div key={label} className="partners__slot" aria-label={label}>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <p className="partners__credit reveal reveal-delay-2">
          Arquidiócesis de San Salvador · El Salvador
        </p>
      </div>
    </section>
  );
}
