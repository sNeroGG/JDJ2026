import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage } from "node:http";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const ADMIN_PASSWORD = process.env.VITE_ADMIN_PASSWORD || "jdj2026";

function safeFileName(name: string) {
  const base = path.basename(name).replace(/[^\w.\-áéíóúñÁÉÍÓÚÑ]+/gi, "-");
  return base.replace(/^-+|-+$/g, "") || `archivo-${Date.now()}`;
}

async function readJsonBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

function sendJson(
  res: {
    statusCode: number;
    setHeader: (k: string, v: string) => void;
    end: (s: string) => void;
  },
  status: number,
  data: unknown,
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function isAuthorized(req: IncomingMessage) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token === ADMIN_PASSWORD;
}

function localMediaPlugin(): Plugin {
  return {
    name: "jdj-local-media",
    configureServer(server) {
      const root = server.config.root;
      const imagesDir = path.join(root, "public", "images");
      const docsDir = path.join(root, "public", "docs");
      const contentFile = path.join(root, "src", "data", "savedContent.ts");

      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] || "";
        if (!url.startsWith("/__admin/")) {
          next();
          return;
        }

        void (async () => {
          if (req.method !== "POST") {
            sendJson(res, 405, { error: "Método no permitido" });
            return;
          }
          if (!isAuthorized(req)) {
            sendJson(res, 401, { error: "No autorizado" });
            return;
          }

          const body = await readJsonBody(req);

          if (url === "/__admin/upload") {
            const folder = body.folder === "docs" ? "docs" : "images";
            const destDir = folder === "docs" ? docsDir : imagesDir;
            const filename = safeFileName(String(body.filename || "archivo"));
            const data = String(body.data || "");
            if (!data) {
              sendJson(res, 400, { error: "Falta el archivo" });
              return;
            }
            const buffer = Buffer.from(data, "base64");
            if (buffer.byteLength > 15 * 1024 * 1024) {
              sendJson(res, 400, { error: "El archivo supera 15 MB." });
              return;
            }
            fs.mkdirSync(destDir, { recursive: true });
            fs.writeFileSync(path.join(destDir, filename), buffer);
            sendJson(res, 200, { url: `/${folder}/${filename}` });
            return;
          }

          if (url === "/__admin/save") {
            const content = body.content ?? {};
            const source = `import type { SiteContent } from "./defaultContent";

/** Overlay generado al guardar desde /admin en local (\`npm run dev\`). */
export const SAVED_CONTENT: Partial<SiteContent> = ${JSON.stringify(content, null, 2)};
`;
            fs.mkdirSync(path.dirname(contentFile), { recursive: true });
            fs.writeFileSync(contentFile, source);
            sendJson(res, 200, { ok: true });
            return;
          }

          sendJson(res, 404, { error: "No encontrado" });
        })().catch((error) => {
          const message =
            error instanceof Error ? error.message : "Error en el servidor local";
          sendJson(res, 500, { error: message });
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localMediaPlugin()],
});
