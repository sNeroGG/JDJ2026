/**
 * Beacon de Cloudflare Web Analytics. Se inyecta en el HTML del build solo si
 * hay token, así el sitio sigue funcionando igual mientras no esté configurado.
 *
 * El token no es secreto: viaja en el HTML público. Se lee de una variable de
 * entorno para no tener que editar el HTML a mano.
 */

const BEACON_SRC = "https://static.cloudflareinsights.com/beacon.min.js";
const PLACEHOLDER = /<!--\s*analytics-tag[\s\S]*?-->/;

export function buildBeaconTag(token) {
  const clean = String(token || "").trim();
  if (!clean) return "";
  // El seguimiento de rutas de SPA viene activado por defecto en el beacon.
  const config = JSON.stringify({ token: clean });
  return `<script defer src="${BEACON_SRC}" data-cf-beacon='${config}'></script>`;
}

export function injectAnalytics(html, env = process.env) {
  const tag = buildBeaconTag(env.VITE_CF_BEACON_TOKEN);
  return html.replace(PLACEHOLDER, () => tag);
}
