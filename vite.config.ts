import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage } from "node:http";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error local ESM helper without types
import { injectAnalytics } from "./scripts/analytics.mjs";
// @ts-expect-error local ESM helper without types
import { optimizeImage, toWebp } from "./scripts/optimize-image.mjs";
// @ts-expect-error local ESM helper without types
import { renderPdfCover } from "./scripts/pdf-cover.mjs";
import {
  buildRobotsTxt,
  buildSitemapXml,
  injectSeo,
  readSavedContent,
  resolveSiteUrl,
  // @ts-expect-error local ESM helper without types
} from "./scripts/seo.mjs";
import {
  loadInstagramFeed,
  normalizeHandle,
} from "./src/server/instagramFeed.ts";
import type { StoreOrder } from "./src/data/defaultContent.ts";
import {
  adjustProductStock,
  listStoreProducts,
  readSavedContent as readStoreContent,
  readSavedOrders,
  stockMap,
  writeSavedOrders,
} from "./src/server/storePersist.ts";
import {
  buildStoreOrder,
  parseCreateOrder,
  whatsappOrderUrl,
} from "./src/utils/store.ts";

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

type BuildEnv = Record<string, string | undefined>;

function localMediaPlugin(env: BuildEnv): Plugin {
  return {
    name: "jdj-local-media",
    transformIndexHtml(html) {
      const withSeo = injectSeo(html, process.cwd(), env) as string;
      return injectAnalytics(withSeo, env) as string;
    },
    generateBundle() {
      const siteUrl = resolveSiteUrl(
        readSavedContent(process.cwd()),
        env,
      ) as string;
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: buildRobotsTxt(siteUrl) as string,
      });
      const sitemap = buildSitemapXml(siteUrl) as string;
      if (sitemap) {
        this.emitFile({
          type: "asset",
          fileName: "sitemap.xml",
          source: sitemap,
        });
      }
    },
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
          if (url === "/__admin/files" && req.method === "GET") {
            if (!isAuthorized(req)) {
              sendJson(res, 401, { error: "No autorizado" });
              return;
            }
            fs.mkdirSync(docsDir, { recursive: true });
            const docs = fs
              .readdirSync(docsDir)
              .filter(
                (name) =>
                  name !== ".gitkeep" &&
                  !name.startsWith(".") &&
                  name !== "covers" &&
                  fs.statSync(path.join(docsDir, name)).isFile(),
              )
              .map((name) => ({
                name,
                url: `/docs/${name}`,
              }));
            sendJson(res, 200, { docs });
            return;
          }

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
            const dest = path.join(destDir, filename);
            fs.writeFileSync(dest, buffer);
            if (folder === "images") {
              await optimizeImage(dest);
              const webpPath = await toWebp(dest);
              sendJson(res, 200, {
                url: `/${folder}/${path.basename(webpPath)}`,
              });
              return;
            }
            sendJson(res, 200, {
                url: `/${folder}/${filename}`,
                coverUrl: filename.toLowerCase().endsWith(".pdf")
                  ? await renderPdfCover(
                      dest,
                      path.join(destDir, "covers"),
                    ).catch((error: unknown) => {
                      console.warn("No se pudo crear la portada del PDF:", error);
                      return undefined;
                    })
                  : undefined,
              });
            return;
          }

          if (url === "/__admin/save") {
            const content = body.content ?? {};
            const source = `import type { SavedContent } from "./defaultContent";

/** Overlay generado al guardar desde /admin en local (\`npm run dev\`). */
export const SAVED_CONTENT: SavedContent = ${JSON.stringify(content, null, 2)};
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

function localStoreApiPlugin(): Plugin {
  return {
    name: "jdj-store-api",
    configureServer(server) {
      const root = server.config.root;

      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] || "";
        if (url !== "/api/store" && url !== "/api/orders" && url !== "/api/instagram") {
          next();
          return;
        }

        void (async () => {
          if (url === "/api/instagram" && req.method === "GET") {
            const requestUrl = new URL(req.url || "/", "http://localhost");
            const handle = requestUrl.searchParams.get("handle") || "pjarqui_ss";
            const saved = readStoreContent(root);
            const fallback = Array.isArray(
              (saved as { instagram?: { posts?: string[] } }).instagram?.posts,
            )
              ? (saved as { instagram?: { posts?: string[] } }).instagram!.posts!
              : [];
            const feed = await loadInstagramFeed(
              normalizeHandle(handle),
              fallback,
            );
            sendJson(res, 200, feed);
            return;
          }
          if (url === "/api/store" && req.method === "GET") {
            sendJson(res, 200, {
              stock: stockMap(listStoreProducts(root)),
            });
            return;
          }

          if (url === "/api/orders" && req.method === "GET") {
            if (!isAuthorized(req)) {
              sendJson(res, 401, { error: "No autorizado" });
              return;
            }
            sendJson(res, 200, {
              orders: readSavedOrders(root).slice().reverse(),
              persist: "file",
            });
            return;
          }

          if (url === "/api/orders" && req.method === "POST") {
            const body = await readJsonBody(req);
            const parsed = parseCreateOrder(body);
            if ("error" in parsed) {
              sendJson(res, 400, parsed);
              return;
            }
            const products = listStoreProducts(root);
            const product = products.find((item) => item.id === parsed.productId);
            if (!product) {
              sendJson(res, 404, { error: "Producto no encontrado." });
              return;
            }
            const order = buildStoreOrder(parsed, product);
            if ("error" in order) {
              sendJson(res, 409, order);
              return;
            }
            const stock = adjustProductStock(root, product.id, -order.quantity);
            if ("error" in stock) {
              sendJson(res, 409, stock);
              return;
            }
            const orders = [...readSavedOrders(root), order];
            writeSavedOrders(root, orders);
            const store = readStoreContent(root).store;
            sendJson(res, 201, {
              ok: true,
              order,
              stock: stock.stock,
              whatsappUrl: whatsappOrderUrl(
                String(store?.whatsapp || ""),
                order,
              ),
            });
            return;
          }

          if (url === "/api/orders" && req.method === "PATCH") {
            if (!isAuthorized(req)) {
              sendJson(res, 401, { error: "No autorizado" });
              return;
            }
            const body = await readJsonBody(req);
            const id = String(body.id || "");
            const status = String(body.status || "") as StoreOrder["status"];
            if (!id || !["nuevo", "atendido", "cancelado"].includes(status)) {
              sendJson(res, 400, { error: "Pedido o estado no válido." });
              return;
            }
            const orders = readSavedOrders(root);
            const index = orders.findIndex((item) => item.id === id);
            if (index < 0) {
              sendJson(res, 404, { error: "Pedido no encontrado." });
              return;
            }
            const current = orders[index];
            if (current.status !== status) {
              if (status === "cancelado" && current.status !== "cancelado") {
                const restored = adjustProductStock(
                  root,
                  current.productId,
                  current.quantity,
                );
                if ("error" in restored) {
                  sendJson(res, 409, restored);
                  return;
                }
              }
              if (current.status === "cancelado" && status !== "cancelado") {
                const taken = adjustProductStock(
                  root,
                  current.productId,
                  -current.quantity,
                );
                if ("error" in taken) {
                  sendJson(res, 409, taken);
                  return;
                }
              }
            }
            orders[index] = { ...current, status };
            writeSavedOrders(root, orders);
            sendJson(res, 200, { ok: true, order: orders[index] });
            return;
          }

          sendJson(res, 405, { error: "Método no permitido" });
        })().catch((error) => {
          const message =
            error instanceof Error ? error.message : "Error en la tienda";
          sendJson(res, 500, { error: message });
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // loadEnv lee los archivos .env; process.env trae lo que define Vercel.
  const env: BuildEnv = {
    ...loadEnv(mode, process.cwd(), ""),
    ...process.env,
  };

  return {
    plugins: [react(), localMediaPlugin(env), localStoreApiPlugin()],
  };
});
