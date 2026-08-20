/** Ruta del overlay dentro del repo, tal como la espera la Contents API de GitHub. */
export const SAVED_CONTENT_FILE = "src/data/savedContent.ts";

/**
 * Serializa el overlay de /admin. La comparten el guardado local (`npm run dev`)
 * y el commit desde producción para que ambos produzcan el mismo archivo.
 */
export function serializeSavedContent(content: unknown) {
  return `import type { SavedContent } from "./defaultContent";

/** Overlay generado al guardar desde /admin. */
export const SAVED_CONTENT: SavedContent = ${JSON.stringify(content, null, 2)};
`;
}
