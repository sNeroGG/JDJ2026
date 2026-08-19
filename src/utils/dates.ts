/** El Salvador no usa horario de verano, así que el desfase es fijo. */
const SV_OFFSET = "-06:00";
const SV_TIME_ZONE = "America/El_Salvador";

const dayFormatter = new Intl.DateTimeFormat("es-SV", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: SV_TIME_ZONE,
});

const shortDayFormatter = new Intl.DateTimeFormat("es-SV", {
  day: "numeric",
  month: "long",
  timeZone: SV_TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat("es-SV", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: SV_TIME_ZONE,
});

/**
 * Acepta `2026-08-15`, `2026-08-15T08:00` o una fecha ISO completa.
 * Cuando no trae zona horaria se interpreta en hora de El Salvador.
 */
export function parseEventDate(value: string): Date | null {
  const raw = value.trim();
  if (!raw) return null;
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  const withTime = raw.includes("T") ? raw : `${raw}T00:00`;
  const date = new Date(hasZone ? raw : `${withTime}${SV_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
};

export function getCountdown(target: Date, from: number = Date.now()) {
  const total = Math.max(0, target.getTime() - from);
  const seconds = Math.floor(total / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    total,
  } satisfies CountdownParts;
}

function sameDay(a: Date, b: Date) {
  return dayFormatter.format(a) === dayFormatter.format(b);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Texto legible de las fechas, con `fallback` cuando aún no hay fecha definida. */
export function formatEventDates(
  startDate: string,
  endDate: string,
  fallback: string,
) {
  const start = parseEventDate(startDate);
  if (!start) return fallback;
  const end = parseEventDate(endDate);

  if (!end || sameDay(start, end)) {
    const day = capitalize(dayFormatter.format(start));
    const hasTime = startDate.includes("T");
    if (!hasTime) return day;
    const time = end
      ? `${timeFormatter.format(start)} – ${timeFormatter.format(end)}`
      : timeFormatter.format(start);
    return `${day} · ${time}`;
  }

  return `${capitalize(shortDayFormatter.format(start))} al ${shortDayFormatter.format(end)} de ${new Intl.DateTimeFormat(
    "es-SV",
    { year: "numeric", timeZone: SV_TIME_ZONE },
  ).format(end)}`;
}
