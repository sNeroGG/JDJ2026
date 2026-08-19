import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import { formatEventDates } from "../utils/dates";
import "./Schedule.css";

export function Schedule() {
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const { schedule } = content;

  if (!schedule.days.length) return null;

  const dateLabel = formatEventDates(
    schedule.startDate,
    schedule.endDate,
    schedule.dateLabel,
  );

  return (
    <section className="section schedule" id="agenda" ref={ref}>
      <div className="section__inner">
        <div className="schedule__intro reveal">
          <p className="section__eyebrow">{schedule.eyebrow}</p>
          <h2 className="section__title">{schedule.title}</h2>
          <p className="section__lead">{schedule.lead}</p>
          {dateLabel ? <p className="schedule__date">{dateLabel}</p> : null}
        </div>

        <div className="schedule__days">
          {schedule.days.map((day, index) => (
            <article
              className={`schedule__day reveal reveal-delay-${(index % 4) + 1}`}
              key={day.id}
            >
              <header className="schedule__day-head">
                <h3>{day.label}</h3>
                {day.date ? <p>{day.date}</p> : null}
              </header>
              <ol className="schedule__list">
                {day.items.map((item) => (
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
          ))}
        </div>
      </div>
    </section>
  );
}
