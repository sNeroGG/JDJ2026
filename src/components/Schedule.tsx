import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import { formatEventDate } from "../utils/dates";
import "./Schedule.css";

export function Schedule() {
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const { schedule } = content;

  if (!schedule.items.length) return null;

  const dateLabel = formatEventDate(schedule.startDate, schedule.dateLabel);

  return (
    <section className="section schedule" id="agenda" ref={ref}>
      <div className="section__inner">
        <div className="schedule__intro reveal">
          <p className="section__eyebrow">{schedule.eyebrow}</p>
          <h2 className="section__title">{schedule.title}</h2>
          <p className="section__lead">{schedule.lead}</p>
          {dateLabel ? <p className="schedule__date">{dateLabel}</p> : null}
        </div>

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
      </div>
    </section>
  );
}
