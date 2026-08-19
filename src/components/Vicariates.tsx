import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import "./Vicariates.css";

export function Vicariates() {
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const { vicariates } = content;

  if (!vicariates.items.length) return null;

  return (
    <section className="section vicariates" id="vicarias" ref={ref}>
      <div className="section__inner">
        <div className="vicariates__intro reveal">
          <p className="section__eyebrow">{vicariates.eyebrow}</p>
          <h2 className="section__title">{vicariates.title}</h2>
          <p className="section__lead">{vicariates.lead}</p>
        </div>

        <ul className="vicariates__grid">
          {vicariates.items.map((item, index) => (
            <li
              className={`vicariates__item reveal reveal-delay-${(index % 4) + 1}`}
              key={item.id}
            >
              <span className="vicariates__bead" aria-hidden="true" />
              <div>
                <strong>{item.name}</strong>
                {item.note ? <span>{item.note}</span> : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
