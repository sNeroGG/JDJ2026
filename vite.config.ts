import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage } from "node:http";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error local ESM helper without types
import { injectAnalytics } from "./scripts/analytics.mjs";
// @ts-expect-error local ESM helper without types
import { optimizeImage, toWebp, writeThumb } from "./scripts/optimize-image.mjs";
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
import { isOrderId } from "./src/utils/ids.ts";
import {
  adjustVariantStock,
  listStoreProducts,
  readSavedContent as readStoreContent,
  readSavedOrders,
  resolveOrderVariantId,
  stockMap,
  writeSavedContent,
  writeSavedOrders,
} from "./src/server/storePersist.ts";
import {
  buildStoreOrder,
  parseCreateOrder,
  whatsappOrderUrl,
} from "./src/utils/store.ts";
import donationsHandler from "./api/donations.ts";
import loginHandler from "./api/login.ts";
import { isAuthorized as isAdminRequest } from "./api/_lib/auth.ts";

function safeFileName(name: string) {
  const base = path.basename(name).replace(/[^\w.\-áéíóúñÁÉÍÓÚÑ]+/gi, "-");
  return base.replace(/^-+|-+$/g, "") || `archivo-${Date.now()}`;
}

function nextSequentialImageStem(dir: string) {
  let max = 0;
  if (fs.existsSync(dir)) {
    for (const name of fs.readdirSync(dir)) {
      const match = name.match(/^(\d{3})(?:\.thumb)?\.(?:webp|jpe?g|png)$/i);
      if (match) max = Math.max(max, Number(match[1]));
    }
  }
  return String(max + 1).padStart(3, "0");
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

      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] || "";
        if (!url.startsWith("/__admin/")) {
          next();
          return;
        }

        void (async () => {
          if (url === "/__admin/files" && req.method === "GET") {
            if (!isAdminRequest(req)) {
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
          if (!isAdminRequest(req)) {
            sendJson(res, 401, { error: "No autorizado" });
            return;
          }

          const body = await readJsonBody(req);

          if (url === "/__admin/upload") {
            const folder = body.folder === "docs" ? "docs" : "images";
            const destDir = folder === "docs" ? docsDir : imagesDir;
            const sequential = folder === "images" && body.sequential === true;
            const originalName = safeFileName(String(body.filename || "archivo"));
            const ext = path.extname(originalName) || ".jpg";
            const filename = sequential
              ? `${nextSequentialImageStem(destDir)}${ext}`
              : originalName;
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
              await writeThumb(webpPath).catch((error: unknown) => {
                console.warn("No se pudo crear la miniatura:", error);
              });
              if (sequential && dest !== webpPath && fs.existsSync(dest)) {
                fs.unlinkSync(dest);
              }
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

const LOCAL_API_ROUTES = [
  "/api/store",
  "/api/orders",
  "/api/instagram",
  "/api/login",
  "/api/content",
  "/api/donations",
];

const DONATION_ENV_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

function localStoreApiPlugin(): Plugin {
  return {
    name: "jdj-store-api",
    configureServer(server) {
      const root = server.config.root;

      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] || "";
        if (!LOCAL_API_ROUTES.includes(url)) {
          next();
          return;
        }

        void (async () => {
          if (url === "/api/donations") {
            await donationsHandler(req, res);
            return;
          }

          if (url === "/api/login") {
            await loginHandler(req, res);
            return;
          }

          if (url === "/api/content") {
            if (req.method === "GET") {
              sendJson(res, 200, { content: readStoreContent(root) });
              return;
            }
            if (req.method !== "POST") {
              sendJson(res, 405, { error: "Método no permitido" });
              return;
            }
            if (!isAdminRequest(req)) {
              sendJson(res, 401, { error: "No autorizado" });
              return;
            }
            const body = await readJsonBody(req);
            const content = body.content;
            if (!content || typeof content !== "object" || Array.isArray(content)) {
              sendJson(res, 400, { error: "El contenido enviado no es válido." });
              return;
            }
            writeSavedContent(root, content as Record<string, unknown>);
            sendJson(res, 200, { ok: true, mode: "local" });
            return;
          }

          if (url === "/api/instagram" && req.method === "GET") {
            const requestUrl = new URL(req.url || "/", "http://localhost");
            const handle = requestUrl.searchParams.get("handle") || "pjarqui_ss";
            const saved = readStoreContent(root);
            const fallback = Array.isArray(
              (saved as { instagram?: { posts?: unknown[] } }).instagram?.posts,
            )
              ? ((saved as { instagram?: { posts?: unknown[] } }).instagram
                  ?.posts as Array<string | { url?: string; imageUrl?: string }>)
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
            if (!isAdminRequest(req)) {
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
            const stock = adjustVariantStock(
              root,
              product.id,
              order.variantId,
              -order.quantity,
            );
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
              total: stock.total,
              variantId: stock.variantId,
              whatsappUrl: whatsappOrderUrl(
                String(store?.whatsapp || ""),
                order,
              ),
            });
            return;
          }

          if (url === "/api/orders" && req.method === "PATCH") {
            if (!isAdminRequest(req)) {
              sendJson(res, 401, { error: "No autorizado" });
              return;
            }
            const body = await readJsonBody(req);
            const id = String(body.id || "");
            const status = String(body.status || "") as StoreOrder["status"];
            if (
              !isOrderId(id) ||
              !["nuevo", "atendido", "cancelado"].includes(status)
            ) {
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
            const variantId = resolveOrderVariantId(root, current);
            if (current.status !== status && variantId) {
              if (status === "cancelado" && current.status !== "cancelado") {
                const restored = adjustVariantStock(
                  root,
                  current.productId,
                  variantId,
                  current.quantity,
                );
                if ("error" in restored) {
                  sendJson(res, 409, restored);
                  return;
                }
              }
              if (current.status === "cancelado" && status !== "cancelado") {
                const taken = adjustVariantStock(
                  root,
                  current.productId,
                  variantId,
                  -current.quantity,
                );
                if ("error" in taken) {
                  sendJson(res, 409, taken);
                  return;
                }
              }
            }
            orders[index] = {
              ...current,
              status,
              variantId: current.variantId || variantId,
            };
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
  for (const key of [...DONATION_ENV_KEYS, "ADMIN_PASSWORD", "VITE_ADMIN_PASSWORD"]) {
    if (env[key]) process.env[key] = env[key];
  }

  return {
    plugins: [react(), localMediaPlugin(env), localStoreApiPlugin()],
    server: {
      watch: {
        ignored: [
          "**/public/audio/**",
          "**/public/images/**",
          "**/public/docs/**",
          "**/src/data/savedContent.ts",
          "**/src/data/savedOrders.ts",
        ],
      },
    },
  };
});
