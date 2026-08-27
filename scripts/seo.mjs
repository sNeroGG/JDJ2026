import fs from "node:fs";
import path from "node:path";

/**
 * Los scrapers de WhatsApp, Facebook e Instagram no ejecutan JavaScript, así que
 * los metadatos para compartir tienen que quedar escritos en el HTML del build.
 * Aquí se leen del mismo `savedContent.ts` que edita /admin.
 */

const FALLBACK_TITLE = "JDJ Jayaque 2026";
const FALLBACK_DESCRIPTION =
  "JDJ Jayaque 2026 — Jornada Diocesana de la Juventud. Tengan valor y síganme. Arquidiócesis de San Salvador.";
const FALLBACK_OG_IMAGE = "/images/og-jdj-2026.jpg";
const FALLBACK_HERO_LOGO = "/images/logo-jdj-2026.webp";
const ROUTES = ["/", "/catequesis", "/tienda", "/donar", "/recuerdos"];

export function readSavedContent(root) {
  try {
    const source = fs.readFileSync(
      path.join(root, "src", "data", "savedContent.ts"),
      "utf8",
    );
    const marker = source.indexOf("SAVED_CONTENT");
    const start = source.indexOf("{", marker === -1 ? 0 : marker);
    const end = source.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) return {};
    return JSON.parse(source.slice(start, end + 1));
  } catch {
    return {};
  }
}

function trimSlashes(value) {
  return String(value).trim().replace(/\/+$/, "");
}

/** Dominio final: lo configurado en /admin, la variable de entorno o el de Vercel. */
export function resolveSiteUrl(saved = {}, env = process.env) {
  const explicit = trimSlashes(saved.site?.url || env.VITE_SITE_URL || "");
  if (explicit) {
    return /^https?:\/\//i.test(explicit) ? explicit : `https://${explicit}`;
  }
  const vercel = trimSlashes(
    env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL || "",
  );
  return vercel ? `https://${vercel}` : "";
}

function absoluteUrl(value, base) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (!base) return value;
  return `${base}${value.startsWith("/") ? "" : "/"}${value}`;
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildSeo(root, env = process.env) {
  const saved = readSavedContent(root);
  const site = saved.site ?? {};
  const title = site.pageTitle || FALLBACK_TITLE;
  const description = site.metaDescription || FALLBACK_DESCRIPTION;
  const siteUrl = resolveSiteUrl(saved, env);
  const image = absoluteUrl(site.ogImage || FALLBACK_OG_IMAGE, siteUrl);
  const siteName =
    [site.name, site.year].filter(Boolean).join(" ") || FALLBACK_TITLE;
  const homeUrl = siteUrl ? `${siteUrl}/` : "";

  const tags = [
    homeUrl && `<link rel="canonical" href="${escapeAttr(homeUrl)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="es_SV" />`,
    `<meta property="og:site_name" content="${escapeAttr(siteName)}" />`,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    homeUrl && `<meta property="og:url" content="${escapeAttr(homeUrl)}" />`,
    image && `<meta property="og:image" content="${escapeAttr(image)}" />`,
    image && `<meta property="og:image:width" content="1200" />`,
    image && `<meta property="og:image:height" content="630" />`,
    image && `<meta property="og:image:alt" content="${escapeAttr(siteName)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
    image && `<meta name="twitter:image" content="${escapeAttr(image)}" />`,
  ]
    .filter(Boolean)
    .join("\n    ");

  return {
    title,
    description,
    siteUrl,
    image,
    tags,
    heroLogo: saved.logoUrl || FALLBACK_HERO_LOGO,
  };
}

export function injectSeo(html, root, env = process.env) {
  const { title, description, tags, heroLogo } = buildSeo(root, env);
  return html
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escapeAttr(title)}</title>`)
    .replace(
      /(<meta name="description" content=")[^"]*(")/,
      (_, open, close) => `${open}${escapeAttr(description)}${close}`,
    )
    .replace(/<!--\s*seo-tags[\s\S]*?-->/, () => tags)
    .replace(
      /(<link\s+rel="preload"\s+as="image"\s+href=")[^"]+("[\s\S]*?data-hero-logo\s*\/>)/,
      (_, open, close) => `${open}${escapeAttr(heroLogo)}${close}`,
    );
}

export function buildRobotsTxt(siteUrl) {
  const lines = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /jdj-cms",
    "Disallow: /api/",
  ];
  if (siteUrl) lines.push("", `Sitemap: ${siteUrl}/sitemap.xml`);
  return `${lines.join("\n")}\n`;
}

export function buildSitemapXml(siteUrl) {
  if (!siteUrl) return "";
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = ROUTES.map(
    (route) => `  <url>
    <loc>${siteUrl}${route}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === "/" ? "1.0" : "0.8"}</priority>
  </url>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
