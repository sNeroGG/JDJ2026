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

const compactDateFormatter = new Intl.DateTimeFormat("es-SV", {
  day: "numeric",
  month: "short",
  year: "numeric",
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

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function calendarDayParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SV_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Inicio del día civil siguiente en El Salvador: el evento de un día ya cerró. */
export function endOfEventDay(start: Date) {
  const startOfDay = parseEventDate(calendarDayParts(start));
  if (!startOfDay) return start;
  return new Date(startOfDay.getTime() + 86400000);
}

/** Texto corto para tarjetas, p. ej. `14 nov 2026`. */
export function formatEventDateCompact(startDate: string, fallback: string) {
  const start = parseEventDate(startDate);
  if (!start) return fallback;
  return compactDateFormatter.format(start).replace(/\./g, "");
}

const timeFormatter = new Intl.DateTimeFormat("es-SV", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: SV_TIME_ZONE,
});

/** Texto legible de la fecha de inicio, con `fallback` cuando aún no está definida. */
export function formatEventDate(startDate: string, fallback: string) {
  const start = parseEventDate(startDate);
  if (!start) return fallback;
  const day = capitalize(dayFormatter.format(start));
  if (!startDate.includes("T")) return day;
  return `${day} · ${timeFormatter.format(start)}`;
}
