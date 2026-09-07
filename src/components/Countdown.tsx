import { useEffect, useMemo, useState } from "react";
import { useContent } from "../context/ContentContext";
import { endOfEventDay, getCountdown, parseEventDate } from "../utils/dates";
import "./Countdown.css";

const UNITS = [
  { key: "days", singular: "día", plural: "días" },
  { key: "hours", singular: "hora", plural: "horas" },
  { key: "minutes", singular: "minuto", plural: "minutos" },
  { key: "seconds", singular: "segundo", plural: "segundos" },
] as const;

type CountdownProps = {
  /** Si se pasa, cuenta hacia esa fecha exacta (sin lógica de “día del evento”). */
  target?: Date | null;
  title?: string;
  eyebrow?: string;
  liveText?: string;
  doneText?: string;
};

export function Countdown({
  target,
  title,
  eyebrow,
  liveText,
  doneText,
}: CountdownProps = {}) {
  const { content } = useContent();
  const { schedule } = content;
  const exact = target !== undefined;
  const start = useMemo(
    () => (exact ? (target ?? null) : parseEventDate(schedule.startDate)),
    [exact, target, schedule.startDate],
  );
  const dayEnd = useMemo(
    () => (exact || !start ? null : endOfEventDay(start)),
    [exact, start],
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!start) return;
    const until = dayEnd?.getTime() ?? start.getTime();
    if (Date.now() >= until) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [start, dayEnd]);

  if (!start) return null;

  const parts = getCountdown(start, now);
  const started = parts.total === 0;
  const finished = exact
    ? started
    : Boolean(dayEnd && now >= dayEnd.getTime());
  const label = eyebrow ?? schedule.countdownEyebrow;

  return (
    <section className="countdown countdown--hero" aria-label={label}>
      {finished ? (
        <p className="countdown__message">
          {doneText ?? schedule.countdownDoneText}
        </p>
      ) : started ? (
        <p className="countdown__message">
          {liveText ?? schedule.countdownLiveText}
        </p>
      ) : (
        <div className="countdown__clock">
          <span className="countdown__title">
            {title ?? schedule.countdownTitle}:
          </span>
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
    </section>
  );
}
