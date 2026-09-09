import { useEffect, useState } from "react";
import { parseEventDate } from "./dates";

/** Apertura pública por defecto: sábado 12 sep 2026, 08:00 (El Salvador). */
export const DEFAULT_REVEAL_AT = "2026-09-12T08:00";

const WEEKDAY_STAMP: Record<string, string> = {
  Sun: "DOM",
  Mon: "LUN",
  Tue: "MAR",
  Wed: "MIE",
  Thu: "JUE",
  Fri: "VIE",
  Sat: "SAB",
};

export function revealAtDate() {
  const raw = import.meta.env.VITE_REVEAL_AT || DEFAULT_REVEAL_AT;
  return parseEventDate(raw);
}

/** Fecha corta de la cortina, p. ej. `SAB 12.09.26 - 08:00AM`. */
export function formatRevealStamp(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/El_Salvador",
    weekday: "short",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const weekday = WEEKDAY_STAMP[get("weekday")] ?? "SAB";
  const day = get("day").padStart(2, "0");
  const month = get("month").padStart(2, "0");
  const year = get("year").slice(-2);
  const hour = get("hour").padStart(2, "0");
  const minute = get("minute").padStart(2, "0");
  const period = get("dayPeriod")
    .replace(/\./g, "")
    .replace(/\s/g, "")
    .toUpperCase();

  return `${weekday} ${day}.${month}.${year} - ${hour}:${minute}${period}`;
}

export function formatRevealAvailability(date: Date) {
  return `LA PAGINA ESTARA DISPONIBLE EL: ${formatRevealStamp(date)}`;
}

export function isRevealReached(now = Date.now()) {
  const revealAt = revealAtDate();
  return Boolean(revealAt && now >= revealAt.getTime());
}

/**
 * La cortina pública está encendida por defecto.
 * Se apaga con `VITE_COMING_SOON=false` o al cumplirse `VITE_REVEAL_AT`.
 */
export function isComingSoonConfigured() {
  const flag = import.meta.env.VITE_COMING_SOON;
  return flag !== "false" && flag !== "0";
}

export function isComingSoonActive(now = Date.now()) {
  return isComingSoonConfigured() && !isRevealReached(now);
}

export function isPublicSiteLocked(
  isAuthenticated: boolean,
  isTeamAuthenticated = false,
  now = Date.now(),
) {
  return isComingSoonActive(now) && !isAuthenticated && !isTeamAuthenticated;
}

export function shouldShowPreviewBanner(
  isAuthenticated: boolean,
  isTeamAuthenticated = false,
  now = Date.now(),
) {
  return isComingSoonActive(now) && (isAuthenticated || isTeamAuthenticated);
}

/** Se actualiza cada segundo mientras la cortina o el banner sigan vigentes. */
export function useComingSoonClock(enabled: boolean) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [enabled]);

  return now;
}
