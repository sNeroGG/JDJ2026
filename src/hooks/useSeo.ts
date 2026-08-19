import { useEffect } from "react";

type SeoOptions = {
  title: string;
  description: string;
  /** Ruta de la página, por ejemplo `/` o `/catequesis`. */
  path: string;
  siteUrl: string;
  image: string;
};

function upsertMeta(key: "name" | "property", value: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(
    `meta[${key}="${value}"]`,
  );
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(key, value);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = "canonical";
    document.head.appendChild(tag);
  }
  tag.href = href;
}

function absolute(value: string, base: string) {
  if (!value) return "";
  try {
    return new URL(value, base || window.location.origin).toString();
  } catch {
    return value;
  }
}

/**
 * Mantiene título, descripción y metadatos sociales sincronizados con el
 * contenido editable. Los scrapers de WhatsApp y Facebook leen el HTML estático
 * que genera el build, esto es para la navegación entre rutas.
 */
export function useSeo({ title, description, path, siteUrl, image }: SeoOptions) {
  useEffect(() => {
    const base = siteUrl || window.location.origin;
    const pageUrl = absolute(path, base);
    const imageUrl = absolute(image, base);

    document.title = title;
    upsertMeta("name", "description", description);
    upsertCanonical(pageUrl);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", pageUrl);
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    if (imageUrl) {
      upsertMeta("property", "og:image", imageUrl);
      upsertMeta("name", "twitter:image", imageUrl);
    }
  }, [title, description, path, siteUrl, image]);
}
