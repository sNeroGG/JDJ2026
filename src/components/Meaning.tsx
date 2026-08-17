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
    if (!meaning.elements.some((item) => item.id === active)) {
      setActive(meaning.elements[0]?.id ?? "");
    }
  }, [meaning.elements, active]);

  const current =
    meaning.elements.find((item) => item.id === active) ?? meaning.elements[0];

  if (!current) return null;

  return (
    <section className="section meaning" id="significado" ref={ref}>
      <div className="section__inner">
        <div className="meaning__intro reveal">
          <p className="section__eyebrow">{meaning.eyebrow}</p>
          <h2 className="section__title">{meaning.title}</h2>
          <p className="section__lead">{meaning.lead}</p>
        </div>

        <div className="meaning__layout">
          <div className="meaning__visual reveal reveal-delay-1">
            <img src={logoUrl} alt="Emblema JDJ Jayaque 2026" />
            <p className="meaning__quote">“{meaning.quote || hero.slogan}”</p>
          </div>

          <div className="meaning__explorer reveal reveal-delay-2">
            <div
              className="meaning__tabs"
              role="tablist"
              aria-label="Elementos del logo"
            >
              {meaning.elements.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active === item.id}
                  className={`meaning__tab meaning__tab--${item.accent} ${
                    active === item.id ? "is-active" : ""
                  }`}
                  onClick={() => setActive(item.id)}
                >
                  <span>{item.title}</span>
                  <small>{item.summary}</small>
                </button>
              ))}
            </div>

            <article
              key={current.id}
              className={`meaning__detail meaning__detail--${current.accent}`}
              role="tabpanel"
            >
              <h3>{current.title}</h3>
              <p>{current.body}</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
