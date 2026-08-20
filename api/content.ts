import type { IncomingMessage, ServerResponse } from "node:http";
import {
  SAVED_CONTENT_FILE,
  serializeSavedContent,
} from "../src/server/contentFile.ts";
import { isAuthorized } from "./_lib/auth.ts";
import { commitFile } from "./_lib/github.ts";
import { readBody, send } from "./_lib/http.ts";

const MAX_CONTENT_BYTES = 1024 * 1024;

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (req.method !== "POST") {
    send(res, 405, { error: "Método no permitido" });
    return;
  }
  if (!isAuthorized(req)) {
    send(res, 401, { error: "No autorizado" });
    return;
  }

  try {
    const body = await readBody(req);
    const content = body.content;
    if (!content || typeof content !== "object" || Array.isArray(content)) {
      send(res, 400, { error: "El contenido enviado no es válido." });
      return;
    }

    const source = serializeSavedContent(content);
    if (Buffer.byteLength(source) > MAX_CONTENT_BYTES) {
      send(res, 413, {
        error: "El contenido es demasiado grande para publicarlo.",
      });
      return;
    }
    // Un data: URL aquí significa un archivo incrustado, que infla el repo y que
    // mergeContent descarta de todos modos al leerlo.
    if (source.includes('"data:')) {
      send(res, 400, {
        error:
          "Hay imágenes o documentos incrustados. Súbelos en local con npm run dev.",
      });
      return;
    }

    const result = await commitFile(
      SAVED_CONTENT_FILE,
      source,
      "chore(admin): actualizar contenido del sitio",
    );
    if (!result.ok) {
      send(res, 502, { error: result.error });
      return;
    }

    send(res, 200, { ok: true, mode: "github", commit: result.sha });
  } catch (error) {
    send(res, 500, {
      error:
        error instanceof Error ? error.message : "No se pudo guardar el contenido.",
    });
  }
}
