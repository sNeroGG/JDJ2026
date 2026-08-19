import type { NavLink, SiteContent } from "../data/defaultContent";

/**
 * Anclas que realmente se renderizan en la landing. Agenda, inscripción,
 * vicarías y FAQ se ocultan sin contenido; la inscripción también se oculta
 * mientras esté desactivada. Catequesis vive en su propia página, no aquí.
 */
export function getVisibleAnchors(content: SiteContent) {
  const anchors = new Set(["#inicio", "#donde", "#auspiciadores", "#contacto"]);
  if (content.meaning.elements.length) anchors.add("#significado");
  if (content.event.items.length) anchors.add("#evento");
  if (content.schedule.items.length) anchors.add("#agenda");
  if (
    content.registration.enabled &&
    (content.registration.steps.length || content.registration.ctaHref)
  ) {
    anchors.add("#inscripcion");
  }
  if (content.vicariates.items.length) anchors.add("#vicarias");
  if (content.faq.items.length) anchors.add("#faq");
  return anchors;
}

export function filterNavLinks(nav: NavLink[], content: SiteContent) {
  const anchors = getVisibleAnchors(content);
  return nav.filter((item) => !item.href.startsWith("#") || anchors.has(item.href));
}
