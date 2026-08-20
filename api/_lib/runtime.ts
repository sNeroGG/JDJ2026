import fs from "node:fs";
import { SAVED_CONTENT } from "../../src/data/savedContent.js";
import { SAVED_ORDERS } from "../../src/data/savedOrders.js";
import type { StoreOrder, StoreProduct } from "../../src/data/defaultContent.js";
import { commitFile } from "./github.js";
import {
  applyStockMap,
  normalizeStoreProducts,
  orderVariantId,
  stockMapFromProducts,
  withAdjustedVariantStock,
  type StoreStockMap,
} from "../../src/utils/store.js";

export { persistKind } from "./github.js";

const ORDERS_PATH = "/tmp/jdj-orders.json";
const STOCK_PATH = "/tmp/jdj-stock.json";

function productsFromContent(): StoreProduct[] {
  const store = (
    SAVED_CONTENT as {
      store?: { products?: StoreProduct[]; whatsapp?: string };
    }
  ).store;
  return normalizeStoreProducts(store?.products);
}

export function storeWhatsapp() {
  const store = (SAVED_CONTENT as { store?: { whatsapp?: string } }).store;
  return String(store?.whatsapp || "");
}

export function listProducts(): StoreProduct[] {
  return applyStockMap(productsFromContent(), readStockOverlay());
}

export function stockMap() {
  return stockMapFromProducts(listProducts());
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

function readStockOverlay(): StoreStockMap {
  const raw = readJsonFile<StoreStockMap | Record<string, number>>(
    STOCK_PATH,
    {},
  );
  const first = Object.values(raw)[0];
  if (typeof first === "number") return {};
  return raw as StoreStockMap;
}

export function readOrders(): StoreOrder[] {
  return readJsonFile<StoreOrder[]>(ORDERS_PATH, [...SAVED_ORDERS]);
}

export function writeOrders(orders: StoreOrder[]) {
  writeJsonFile(ORDERS_PATH, orders);
  void commitFile(
    "src/data/savedOrders.ts",
    `import type { StoreOrder } from "./defaultContent";

/** Pedidos generados desde /tienda. */
export const SAVED_ORDERS: StoreOrder[] = ${JSON.stringify(orders, null, 2)};
`,
    "chore: actualizar pedidos de la tienda",
  );
}

export function writeStock(productId: string, variantId: string, stock: number) {
  const overlay = readStockOverlay();
  overlay[productId] = { ...(overlay[productId] ?? {}), [variantId]: stock };
  writeJsonFile(STOCK_PATH, overlay);
}

export function adjustStock(
  productId: string,
  variantId: string,
  delta: number,
) {
  const product = listProducts().find((item) => item.id === productId);
  if (!product) return { error: "Producto no encontrado." };
  const adjusted = withAdjustedVariantStock(product, variantId, delta);
  if ("error" in adjusted) return adjusted;
  writeStock(productId, variantId, adjusted.stock);
  return {
    stock: adjusted.stock,
    total: adjusted.total,
    variantId,
  };
}

export function resolveOrderVariantId(order: StoreOrder) {
  const product = listProducts().find((item) => item.id === order.productId);
  return orderVariantId(order, product);
}
