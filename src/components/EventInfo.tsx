import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import "./EventInfo.css";

export function EventInfo() {
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const { event } = content;

  return (
    <section className="section event" id="evento" ref={ref}>
      <div className="section__inner">
        <div className="event__intro reveal">
          <p className="section__eyebrow">{event.eyebrow}</p>
          <h2 className="section__title">{event.title}</h2>
          <p className="section__lead">{event.lead}</p>
        </div>

        <div className="event__list">
          {event.items.map((item, index) => (
            <article
              key={item.id}
              className={`event__item reveal reveal-delay-${(index % 4) + 1}`}
            >
              <span>{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
