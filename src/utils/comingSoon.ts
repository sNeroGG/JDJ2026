import { useEffect, useState } from "react";
import { parseEventDate } from "./dates";

/** Apertura por defecto: 5 días a partir de la tarde del 7 sep 2026. */
export const DEFAULT_REVEAL_AT = "2026-09-12T16:00";

export function revealAtDate() {
  const raw = import.meta.env.VITE_REVEAL_AT || DEFAULT_REVEAL_AT;
  return parseEventDate(raw);
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
