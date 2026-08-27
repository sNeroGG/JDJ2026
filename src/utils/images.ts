/** Miniatura de grilla a partir de la foto grande. Si no existe, el img hace fallback. */
export function thumbSrc(src: string) {
  if (!src || src.includes(".thumb.")) return src;
  return src.replace(/(\.[a-z0-9]+)(\?.*)?$/i, ".thumb.webp$2");
}
