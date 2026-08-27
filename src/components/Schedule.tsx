import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import { formatEventDate } from "../utils/dates";
import { SiteLink } from "./SiteLink";
import "./Schedule.css";

export function Schedule({ page = false }: { page?: boolean }) {
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const { schedule } = content;

  if (!page && !schedule.items.length) return null;

  const dateLabel = formatEventDate(schedule.startDate, schedule.dateLabel);
  const Title = page ? "h1" : "h2";

  return (
    <section
      className={`section schedule${page ? " schedule--page" : ""}`}
      id={page ? undefined : "agenda"}
      ref={ref}
    >
      <div className="section__inner">
        <div className="schedule__intro reveal">
          {page ? null : (
            <p className="section__eyebrow">{schedule.eyebrow}</p>
          )}
          <Title className="section__title">{schedule.title}</Title>
          {schedule.lead ? (
            <p className="section__lead">{schedule.lead}</p>
          ) : null}
          {dateLabel ? <p className="schedule__date">{dateLabel}</p> : null}
        </div>

        {schedule.items.length ? (
          <article className="schedule__day reveal">
            <ol className="schedule__list">
              {schedule.items.map((item) => (
                <li key={item.id}>
                  <span className="schedule__time">{item.time}</span>
                  <div className="schedule__entry">
                    <h4>{item.title}</h4>
                    {item.text ? <p>{item.text}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          </article>
        ) : (
          <p className="schedule__empty reveal">
            Pronto publicaremos el programa de la jornada, hora por hora.
          </p>
        )}

        {page ? (
          <SiteLink className="schedule__back" href="#donde">
            Volver a Sede
          </SiteLink>
        ) : null}
      </div>
    </section>
  );
}
