import { useEffect, useMemo, useState } from "react";
import { useContent } from "../context/ContentContext";
import {
  endOfEventDay,
  formatEventDate,
  getCountdown,
  parseEventDate,
} from "../utils/dates";
import "./Countdown.css";

const UNITS = [
  { key: "days", singular: "día", plural: "días" },
  { key: "hours", singular: "hora", plural: "horas" },
  { key: "minutes", singular: "minuto", plural: "minutos" },
  { key: "seconds", singular: "segundo", plural: "segundos" },
] as const;

export function Countdown() {
  const { content } = useContent();
  const { schedule } = content;
  const start = useMemo(
    () => parseEventDate(schedule.startDate),
    [schedule.startDate],
  );
  const dayEnd = useMemo(() => (start ? endOfEventDay(start) : null), [start]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!start || !dayEnd) return;
    if (Date.now() >= dayEnd.getTime()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [start, dayEnd]);

  if (!start) return null;

  const parts = getCountdown(start, now);
  const started = parts.total === 0;
  const finished = Boolean(dayEnd && now >= dayEnd.getTime());
  const dateLabel = formatEventDate(schedule.startDate, schedule.dateLabel);

  return (
    <section className="countdown" aria-label={schedule.countdownEyebrow}>
      <div className="countdown__inner">
        <div className="countdown__intro">
          <p className="countdown__eyebrow">{schedule.countdownEyebrow}</p>
          <p className="countdown__date">{dateLabel}</p>
        </div>

        {finished ? (
          <p className="countdown__message">{schedule.countdownDoneText}</p>
        ) : started ? (
          <p className="countdown__message">{schedule.countdownLiveText}</p>
        ) : (
          <div className="countdown__clock">
            <span className="countdown__title">{schedule.countdownTitle}</span>
            <div className="countdown__units" aria-hidden="true">
              {UNITS.map((unit) => (
                <div className="countdown__unit" key={unit.key}>
                  <strong>{String(parts[unit.key]).padStart(2, "0")}</strong>
                  <span>
                    {parts[unit.key] === 1 ? unit.singular : unit.plural}
                  </span>
                </div>
              ))}
            </div>
            <span className="sr-only">
              {`Faltan ${parts.days} ${parts.days === 1 ? "día" : "días"} para la ${content.site.name} ${content.site.year}.`}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
