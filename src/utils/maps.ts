import type { SiteContent } from "../data/defaultContent";

type MapSource = Pick<
  SiteContent["location"],
  "mapQuery" | "mapLat" | "mapLng" | "parishName" | "placeLine"
>;

function coords(location: MapSource) {
  const lat = location.mapLat.trim();
  const lng = location.mapLng.trim();
  return lat && lng ? `${lat},${lng}` : "";
}

/** Consulta que identifica la sede: coordenadas si existen, si no el texto. */
export function mapQuery(location: MapSource) {
  return (
    coords(location) ||
    location.mapQuery.trim() ||
    [location.parishName, location.placeLine].filter(Boolean).join(", ")
  );
}

/** Iframe de Google Maps sin API key. */
export function mapEmbedUrl(location: MapSource) {
  const query = mapQuery(location);
  if (!query) return "";
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&hl=es&output=embed`;
}

export function mapDirectionsUrl(location: MapSource) {
  const query = mapQuery(location);
  if (!query) return "";
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function mapWazeUrl(location: MapSource) {
  const point = coords(location);
  if (point) {
    return `https://waze.com/ul?ll=${encodeURIComponent(point)}&navigate=yes`;
  }
  const query = mapQuery(location);
  if (!query) return "";
  return `https://waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`;
}
