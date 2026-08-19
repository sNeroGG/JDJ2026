import type { NavLink, SiteContent } from "../data/defaultContent";

/**
 * Anclas que realmente se renderizan en la landing. Las secciones nuevas
 * (agenda, inscripción, vicarías, FAQ) se ocultan mientras no tengan contenido,
 * así que el menú tampoco debe enlazarlas.
 */
export function getVisibleAnchors(content: SiteContent) {
  const anchors = new Set(["#inicio", "#donde", "#auspiciadores", "#contacto"]);
  if (content.meaning.elements.length) anchors.add("#significado");
  if (content.event.items.length) anchors.add("#evento");
  if (content.schedule.items.length) anchors.add("#agenda");
  if (content.registration.steps.length || content.registration.ctaHref) {
    anchors.add("#inscripcion");
  }
  if (content.vicariates.items.length) anchors.add("#vicarias");
  if (content.faq.items.length) anchors.add("#faq");
  anchors.add("#catequesis");
  return anchors;
}

export function filterNavLinks(nav: NavLink[], content: SiteContent) {
  const anchors = getVisibleAnchors(content);
  return nav.filter((item) => !item.href.startsWith("#") || anchors.has(item.href));
}
