import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import "./Location.css";

export function Location() {
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const { location } = content;

  return (
    <section className="section location" id="donde" ref={ref}>
      <div className="section__inner location__grid">
        <div className="location__copy reveal">
          <p className="section__eyebrow">{location.eyebrow}</p>
          <h2 className="section__title">{location.title}</h2>
          <p className="section__lead">{location.lead}</p>
        </div>

        <div className="location__panel reveal reveal-delay-1">
          <div className="location__place">
            <span className="location__label">{location.parishLabel}</span>
            <strong>{location.parishName}</strong>
            <span>{location.placeLine}</span>
          </div>
          <p className="location__note">{location.note}</p>
          <ul className="location__facts">
            {location.facts.map((fact) => (
              <li key={fact.id}>
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
