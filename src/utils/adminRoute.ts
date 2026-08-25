/** Ruta del panel. No está en el menú, el sitemap ni en /admin. */
export const ADMIN_ROUTE = "/jdj-cms";

export function isAdminPath(pathname: string) {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  return path === ADMIN_ROUTE || path === "/admin";
}
