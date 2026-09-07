/** Puerta del equipo. No está en el menú, el sitemap ni en /jdj-cms. */
export const TEAM_ROUTE = "/equipo";

/** Distinta de AUTH_KEY: esta sesión no abre el CMS. */
export const TEAM_AUTH_KEY = "jdj2026-team-auth";
export const TEAM_SECRET_KEY = "jdj2026-team-secret";

export function isTeamPath(pathname: string) {
  let path = pathname;
  try {
    if (pathname.includes("://")) {
      path = new URL(pathname).pathname;
    }
  } catch {
    path = pathname;
  }
  path = (path.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  return path === TEAM_ROUTE;
}

export function loadTeamAuth() {
  return sessionStorage.getItem(TEAM_AUTH_KEY) === "1";
}
