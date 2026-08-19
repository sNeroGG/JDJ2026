import { useEffect, useState } from "react";
import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import "./Meaning.css";

export function Meaning() {
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const { meaning, logoUrl, hero } = content;
  const [active, setActive] = useState(meaning.elements[0]?.id ?? "");

  useEffect(() => {
    if (active && !meaning.elements.some((item) => item.id === active)) {
      setActive(meaning.elements[0]?.id ?? "");
    }
  }, [meaning.elements, active]);

  if (!meaning.elements.length) return null;

  return (
    <section className="section meaning" id="significado" ref={ref}>
      <div className="section__inner">
        <div className="meaning__intro reveal">
          <p className="section__eyebrow">{meaning.eyebrow}</p>
          <h2 className="section__title">{meaning.title}</h2>
          <p className="section__lead">{meaning.lead}</p>
        </div>

        <div className="meaning__layout">
          <div className="meaning__visual">
            <img
              src={logoUrl}
              alt="Emblema JDJ Jayaque 2026"
              width={400}
              height={400}
              decoding="async"
            />
            <p className="meaning__quote">“{meaning.quote || hero.slogan}”</p>
          </div>

          <div className="meaning__explorer reveal reveal-delay-2">
            <div className="meaning__accordion" aria-label="Elementos del logo">
              {meaning.elements.map((item) => {
                const isOpen = active === item.id;
                return (
                  <div
                    key={item.id}
                    className={`meaning__item${isOpen ? " is-open" : ""}`}
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`meaning-panel-${item.id}`}
                      className={`meaning__tab meaning__tab--${item.accent}${
                        isOpen ? " is-active" : ""
                      }`}
                      onClick={() => setActive(isOpen ? "" : item.id)}
                    >
                      <span>{item.title}</span>
                      <small>{item.summary}</small>
                    </button>
                    {isOpen ? (
                      <article
                        id={`meaning-panel-${item.id}`}
                        className={`meaning__detail meaning__detail--${item.accent}`}
                      >
                        <p>{item.body}</p>
                      </article>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
