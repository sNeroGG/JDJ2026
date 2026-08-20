import fs from "node:fs";
import path from "node:path";
import type { StoreOrder, StoreProduct } from "../data/defaultContent.ts";
import { serializeSavedContent } from "./contentFile.ts";

type SavedFile = {
  store?: {
    products?: StoreProduct[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export function ordersFile(root: string) {
  return path.join(root, "src", "data", "savedOrders.ts");
}

export function contentFile(root: string) {
  return path.join(root, "src", "data", "savedContent.ts");
}

export function parseTsJson(source: string) {
  const eq = source.indexOf("=");
  const startObj = source.indexOf("{", eq);
  const startArr = source.indexOf("[", eq);
  const start =
    startArr === -1
      ? startObj
      : startObj === -1
        ? startArr
        : Math.min(startObj, startArr);
  const endObj = source.lastIndexOf("}");
  const endArr = source.lastIndexOf("]");
  const end = Math.max(endObj, endArr);
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No se pudo leer el archivo de datos.");
  }
  return JSON.parse(source.slice(start, end + 1)) as unknown;
}

export function readSavedContent(root: string): SavedFile {
  const source = fs.readFileSync(contentFile(root), "utf8");
  return parseTsJson(source) as SavedFile;
}

export function readSavedOrders(root: string): StoreOrder[] {
  try {
    const source = fs.readFileSync(ordersFile(root), "utf8");
    const parsed = parseTsJson(source);
    return Array.isArray(parsed) ? (parsed as StoreOrder[]) : [];
  } catch {
    return [];
  }
}

export function writeSavedOrders(root: string, orders: StoreOrder[]) {
  const source = `import type { StoreOrder } from "./defaultContent";

/** Pedidos generados desde /tienda. En local los escribe \`npm run dev\`. */
export const SAVED_ORDERS: StoreOrder[] = ${JSON.stringify(orders, null, 2)};
`;
  fs.writeFileSync(ordersFile(root), source);
}

export function writeSavedContent(root: string, content: SavedFile) {
  fs.writeFileSync(contentFile(root), serializeSavedContent(content));
}

export function listStoreProducts(root: string): StoreProduct[] {
  const content = readSavedContent(root);
  return Array.isArray(content.store?.products) ? content.store.products : [];
}

export function stockMap(products: StoreProduct[]) {
  return Object.fromEntries(products.map((item) => [item.id, item.stock]));
}

export function adjustProductStock(
  root: string,
  productId: string,
  delta: number,
) {
  const content = readSavedContent(root);
  const store = { ...(content.store ?? {}) };
  const products = Array.isArray(store.products) ? [...store.products] : [];
  const index = products.findIndex((item) => item.id === productId);
  if (index < 0) return { error: "Producto no encontrado." };
  const nextStock = (Number(products[index].stock) || 0) + delta;
  if (nextStock < 0) {
    return { error: "No hay suficientes unidades." };
  }
  products[index] = { ...products[index], stock: nextStock };
  store.products = products;
  content.store = store;
  writeSavedContent(root, content);
  return { stock: nextStock, products };
}
