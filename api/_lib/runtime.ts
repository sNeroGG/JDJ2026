import fs from "node:fs";
import { SAVED_CONTENT } from "../../src/data/savedContent.ts";
import { SAVED_ORDERS } from "../../src/data/savedOrders.ts";
import type { StoreOrder, StoreProduct } from "../../src/data/defaultContent.ts";

const ORDERS_PATH = "/tmp/jdj-orders.json";
const STOCK_PATH = "/tmp/jdj-stock.json";

function productsFromContent(): StoreProduct[] {
  const store = (
    SAVED_CONTENT as {
      store?: { products?: StoreProduct[]; whatsapp?: string };
    }
  ).store;
  return Array.isArray(store?.products) ? store.products : [];
}

export function storeWhatsapp() {
  const store = (SAVED_CONTENT as { store?: { whatsapp?: string } }).store;
  return String(store?.whatsapp || "");
}

export function listProducts(): StoreProduct[] {
  const products = productsFromContent().map((item) => ({ ...item }));
  const overlay = readStockOverlay();
  return products.map((item) => ({
    ...item,
    stock: overlay[item.id] ?? item.stock,
  }));
}

export function stockMap() {
  return Object.fromEntries(listProducts().map((item) => [item.id, item.stock]));
}

function readJsonFile<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJsonFile(file: string, value: unknown) {
  fs.writeFileSync(file, JSON.stringify(value));
}

function readStockOverlay() {
  return readJsonFile<Record<string, number>>(STOCK_PATH, {});
}

export function readOrders(): StoreOrder[] {
  return readJsonFile<StoreOrder[]>(ORDERS_PATH, [...SAVED_ORDERS]);
}

export function writeOrders(orders: StoreOrder[]) {
  writeJsonFile(ORDERS_PATH, orders);
  void persistGithub(
    "src/data/savedOrders.ts",
    `import type { StoreOrder } from "./defaultContent";

/** Pedidos generados desde /tienda. */
export const SAVED_ORDERS: StoreOrder[] = ${JSON.stringify(orders, null, 2)};
`,
    "chore: actualizar pedidos de la tienda",
  );
}

export function writeStock(productId: string, stock: number) {
  const overlay = readStockOverlay();
  overlay[productId] = stock;
  writeJsonFile(STOCK_PATH, overlay);
}

export function adjustStock(productId: string, delta: number) {
  const product = listProducts().find((item) => item.id === productId);
  if (!product) return { error: "Producto no encontrado." };
  const next = product.stock + delta;
  if (next < 0) return { error: "No hay suficientes unidades." };
  writeStock(productId, next);
  return { stock: next };
}

function toBase64(value: string) {
  return Buffer.from(value).toString("base64");
}

async function persistGithub(filePath: string, contents: string, message: string) {
  const token = process.env.GITHUB_TOKEN;
  const owner =
    process.env.GITHUB_REPO_OWNER || process.env.VERCEL_GIT_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME || process.env.VERCEL_GIT_REPO_SLUG;
  const branch =
    process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "main";
  if (!token || !owner || !repo) return false;

  const api = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "jdj2026-store",
  };

  try {
    const existing = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, {
      headers,
    });
    const payload = (await existing.json().catch(() => null)) as {
      sha?: string;
    } | null;
    const put = await fetch(api, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        content: toBase64(contents),
        branch,
        sha: payload?.sha,
      }),
    });
    return put.ok;
  } catch {
    return false;
  }
}

export function persistKind() {
  return process.env.GITHUB_TOKEN ? "github" : "memory";
}
