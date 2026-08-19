import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import "./Faq.css";

export function Faq() {
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const { faq } = content;

  if (!faq.items.length) return null;

  return (
    <section className="section faq" id="faq" ref={ref}>
      <div className="section__inner faq__grid">
        <div className="faq__intro reveal">
          <p className="section__eyebrow">{faq.eyebrow}</p>
          <h2 className="section__title">{faq.title}</h2>
          <p className="section__lead">{faq.lead}</p>
        </div>

        <div className="faq__list reveal reveal-delay-1">
          {faq.items.map((item) => (
            <details className="faq__item" key={item.id}>
              <summary>
                <span>{item.question}</span>
                <i className="faq__icon" aria-hidden="true" />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
