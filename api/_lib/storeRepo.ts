import fs from "node:fs";
import type {
  StoreOrder,
  StoreOrderStatus,
  StoreProduct,
} from "../../src/data/defaultContent.js";
import {
  applyStockMap,
  orderVariantId,
  productStock,
  stockMapFromProducts,
  variantLabel,
  withAdjustedVariantStock,
  type StoreStockMap,
} from "../../src/utils/store.js";
import {
  adjustVariantStock,
  listStoreProducts,
  readSavedContent,
  readSavedOrders,
  setVariantStock,
  writeSavedOrders,
} from "../../src/server/storePersist.js";
import { bundledOrders, productsFromBundle, storeWhatsapp as bundledWhatsapp } from "./catalog.js";
import { commitFile, isGithubConfigured } from "./github.js";
import {
  deleteStoreOrder,
  ensureStoreStock,
  isSupabaseConfigured,
  listStoreOrders,
  listStoreStock,
  placeStoreOrder,
  StoreConflictError,
  updateStoreOrderStatus,
  upsertStoreStock,
} from "./supabase.js";

const ORDERS_PATH = "/tmp/jdj-orders.json";
const STOCK_PATH = "/tmp/jdj-stock.json";

export type PersistKind = "supabase" | "github" | "memory" | "file";

export { StoreConflictError };

export function persistKind(): PersistKind {
  if (isSupabaseConfigured()) return "supabase";
  if (process.env.VERCEL) return isGithubConfigured() ? "github" : "memory";
  return "file";
}

export function catalogProducts(): StoreProduct[] {
  if (!process.env.VERCEL) {
    try {
      return listStoreProducts(process.cwd());
    } catch {
      return productsFromBundle();
    }
  }
  return productsFromBundle();
}

export function storeWhatsapp() {
  if (!process.env.VERCEL) {
    try {
      return String(readSavedContent(process.cwd()).store?.whatsapp || "");
    } catch {
      /* fall through */
    }
  }
  return bundledWhatsapp();
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

function readTmpStock(): StoreStockMap {
  const raw = readJsonFile<StoreStockMap | Record<string, number>>(
    STOCK_PATH,
    {},
  );
  const first = Object.values(raw)[0];
  if (typeof first === "number") return {};
  return raw as StoreStockMap;
}

function writeTmpStock(productId: string, variantId: string, stock: number) {
  const overlay = readTmpStock();
  overlay[productId] = { ...(overlay[productId] ?? {}), [variantId]: stock };
  writeJsonFile(STOCK_PATH, overlay);
}

function readTmpOrders(): StoreOrder[] {
  return readJsonFile<StoreOrder[]>(ORDERS_PATH, bundledOrders());
}

function writeTmpOrders(orders: StoreOrder[]) {
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

function overlayProducts(products: StoreProduct[], overlay: StoreStockMap) {
  return applyStockMap(products, overlay);
}

export async function liveStockMap(): Promise<StoreStockMap> {
  const catalog = catalogProducts();
  if (isSupabaseConfigured()) {
    await ensureStoreStock(catalog);
    const overlay = await listStoreStock();
    return stockMapFromProducts(overlayProducts(catalog, overlay));
  }
  if (process.env.VERCEL) {
    return stockMapFromProducts(overlayProducts(catalog, readTmpStock()));
  }
  return stockMapFromProducts(catalog);
}

export async function setLiveStock(
  rows: { productId: string; variantId: string; stock: number }[],
) {
  const items = rows
    .filter((row) => row.productId && row.variantId)
    .map((row) => ({
      productId: row.productId,
      variantId: row.variantId,
      stock: Math.max(0, Math.floor(Number(row.stock) || 0)),
    }));
  if (!items.length) return { error: "No hay stock para guardar." as const };

  if (isSupabaseConfigured()) {
    await upsertStoreStock(items);
    return { stock: await liveStockMap(), persist: persistKind() };
  }

  if (process.env.VERCEL) {
    for (const item of items) {
      writeTmpStock(item.productId, item.variantId, item.stock);
    }
    return { stock: await liveStockMap(), persist: persistKind() };
  }

  for (const item of items) {
    const written = setVariantStock(
      process.cwd(),
      item.productId,
      item.variantId,
      item.stock,
    );
    if ("error" in written) return { error: written.error };
  }
  return { stock: await liveStockMap(), persist: persistKind() };
}

export async function liveProducts(): Promise<StoreProduct[]> {
  const catalog = catalogProducts();
  if (isSupabaseConfigured()) {
    await ensureStoreStock(catalog);
    const overlay = await listStoreStock();
    return overlayProducts(catalog, overlay);
  }
  if (process.env.VERCEL) {
    return overlayProducts(catalog, readTmpStock());
  }
  return catalog;
}

export async function readOrders(): Promise<StoreOrder[]> {
  if (isSupabaseConfigured()) return listStoreOrders();
  if (process.env.VERCEL) return readTmpOrders().slice().reverse();
  return readSavedOrders(process.cwd()).slice().reverse();
}

function seedFor(product: StoreProduct, variantId: string) {
  if (product.withoutStock) return 999999;
  const variant = product.variants.find((item) => item.id === variantId);
  return variant?.stock ?? 0;
}

function remainingMessage(product: StoreProduct, variantId: string, left: number) {
  const variant = product.variants.find((item) => item.id === variantId);
  const label = variant ? variantLabel(variant) : "esa talla o color";
  return `Solo quedan ${left} unidad(es) de ${label}.`;
}

export async function placeLiveOrder(order: StoreOrder, catalog: StoreProduct) {
  const variantId = order.variantId;
  const product = catalog;
  const withoutStock = Boolean(product?.withoutStock);

  if (isSupabaseConfigured()) {
    try {
      if (withoutStock) {
        await upsertStoreStock([
          { productId: order.productId, variantId, stock: 999999 },
        ]).catch(() => undefined);
      }
      const placed = await placeStoreOrder(order, seedFor(product, variantId), withoutStock);
      const live = await liveProducts();
      const liveProduct = live.find((item) => item.id === order.productId) ?? catalog;
      const liveVariant = liveProduct.variants.find((item) => item.id === variantId);
      const stock = Number.isFinite(placed.stock)
        ? placed.stock
        : (liveVariant?.stock ?? seedFor(catalog, variantId) - order.quantity);
      return {
        order,
        stock,
        total: productStock(liveProduct),
        variantId,
      };
    } catch (error) {
      if (error instanceof StoreConflictError && error.remaining != null) {
        throw new StoreConflictError(
          remainingMessage(catalog, variantId, error.remaining),
          error.remaining,
        );
      }
      throw error;
    }
  }

  if (process.env.VERCEL) {
    const live = overlayProducts(catalogProducts(), readTmpStock());
    const product = live.find((item) => item.id === order.productId);
    if (!product) return { error: "Producto no encontrado." };
    const adjusted = withAdjustedVariantStock(product, variantId, -order.quantity);
    if ("error" in adjusted) return adjusted;
    writeTmpStock(product.id, variantId, adjusted.stock);
    writeTmpOrders([...readTmpOrders(), order]);
    return {
      order,
      stock: adjusted.stock,
      total: adjusted.total,
      variantId,
    };
  }

  const stock = adjustVariantStock(
    process.cwd(),
    order.productId,
    variantId,
    -order.quantity,
  );
  if ("error" in stock) return stock;
  writeSavedOrders(process.cwd(), [...readSavedOrders(process.cwd()), order]);
  return {
    order,
    stock: stock.stock,
    total: stock.total,
    variantId,
  };
}

export async function placeLiveMultiOrder(order: StoreOrder, catalog: StoreProduct[]) {
  const items = order.items && order.items.length ? order.items : [{
    productId: order.productId,
    productTitle: order.productTitle,
    variantId: order.variantId,
    size: order.size,
    color: order.color,
    quantity: order.quantity,
    unitPrice: order.unitPrice,
    total: order.total,
  }];

  if (isSupabaseConfigured()) {
    let index = 0;
    for (const item of items) {
      index++;
      const subOrderId = items.length > 1 ? `${order.id}_item_${index}` : order.id;
      const subOrder: StoreOrder = {
        ...order,
        id: subOrderId,
        productId: item.productId,
        productTitle: item.productTitle,
        variantId: item.variantId,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      };
      const product = catalog.find((p) => p.id === item.productId);
      const withoutStock = Boolean(product?.withoutStock);
      if (withoutStock) {
        await upsertStoreStock([
          { productId: item.productId, variantId: item.variantId, stock: 999999 },
        ]).catch(() => undefined);
      }
      const seed = seedFor(product || catalog[0], item.variantId);
      await placeStoreOrder(subOrder, seed, withoutStock);
    }
    return { order };
  }

  if (process.env.VERCEL) {
    const live = overlayProducts(catalogProducts(), readTmpStock());
    for (const item of items) {
      const product = live.find((p) => p.id === item.productId);
      if (!product) return { error: `Producto ${item.productTitle} no encontrado.` };
      const adjusted = withAdjustedVariantStock(product, item.variantId, -item.quantity);
      if ("error" in adjusted) return adjusted;
      writeTmpStock(product.id, item.variantId, adjusted.stock);
    }
    writeTmpOrders([...readTmpOrders(), order]);
    return { order };
  }

  for (const item of items) {
    const stock = adjustVariantStock(
      process.cwd(),
      item.productId,
      item.variantId,
      -item.quantity,
    );
    if ("error" in stock) return stock;
  }
  writeSavedOrders(process.cwd(), [...readSavedOrders(process.cwd()), order]);
  return { order };
}

export async function deleteLiveOrder(id: string) {
  const orders = await readOrders();
  const target = orders.find((o) => o.id === id);

  if (target && target.status !== "cancelado") {
    const items =
      target.items && target.items.length > 0
        ? target.items
        : [
            {
              productId: target.productId,
              variantId: target.variantId,
              size: target.size,
              color: target.color,
              quantity: target.quantity,
            },
          ];

    const products = await liveProducts();
    const stockUpdates: { productId: string; variantId: string; stock: number }[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (product?.withoutStock) continue;
      const vId =
        item.variantId ||
        (product ? orderVariantId(target, product) : "");
      if (vId) {
        if (!process.env.VERCEL && !isSupabaseConfigured()) {
          adjustVariantStock(process.cwd(), item.productId, vId, item.quantity);
        } else if (product) {
          const variant = product.variants.find((v) => v.id === vId);
          const nextStock = (variant?.stock ?? 0) + item.quantity;
          stockUpdates.push({ productId: item.productId, variantId: vId, stock: nextStock });
        }
      }
    }

    if (stockUpdates.length > 0) {
      await setLiveStock(stockUpdates).catch(() => undefined);
    }
  }

  if (isSupabaseConfigured()) {
    const ok = await deleteStoreOrder(id);
    return { ok };
  }
  if (process.env.VERCEL) {
    const current = readTmpOrders();
    const filtered = current.filter((o) => o.id !== id);
    if (filtered.length === current.length) return { error: "Pedido no encontrado." };
    writeTmpOrders(filtered);
    return { ok: true };
  }
  const current = readSavedOrders(process.cwd());
  const filtered = current.filter((o) => o.id !== id);
  if (filtered.length === current.length) return { error: "Pedido no encontrado." };
  writeSavedOrders(process.cwd(), filtered);
  return { ok: true };
}


export async function updateLiveOrderStatus(
  id: string,
  status: StoreOrderStatus,
) {
  if (isSupabaseConfigured()) {
    try {
      const order = await updateStoreOrderStatus(id, status);
      if (!order) return { error: "Pedido no encontrado.", http: 404 as const };
      return { order };
    } catch (error) {
      if (error instanceof StoreConflictError) {
        if (error.message === "Pedido no encontrado.") {
          return { error: error.message, http: 404 as const };
        }
        return { error: error.message, http: 409 as const };
      }
      throw error;
    }
  }

  const orders = process.env.VERCEL
    ? readTmpOrders()
    : readSavedOrders(process.cwd());
  const index = orders.findIndex((item) => item.id === id);
  if (index < 0) return { error: "Pedido no encontrado.", http: 404 as const };
  const current = orders[index];
  const catalog = catalogProducts();
  const product = catalog.find((item) => item.id === current.productId);
  const variantId = orderVariantId(current, product);
  const live = process.env.VERCEL
    ? overlayProducts(catalog, readTmpStock())
    : catalog;
  const liveProduct = live.find((item) => item.id === current.productId);

  if (current.status !== status && variantId && liveProduct) {
    if (status === "cancelado" && current.status !== "cancelado") {
      if (process.env.VERCEL) {
        const restored = withAdjustedVariantStock(
          liveProduct,
          variantId,
          current.quantity,
        );
        if ("error" in restored) return { ...restored, http: 409 as const };
        writeTmpStock(current.productId, variantId, restored.stock);
      } else {
        const restored = adjustVariantStock(
          process.cwd(),
          current.productId,
          variantId,
          current.quantity,
        );
        if ("error" in restored) return { ...restored, http: 409 as const };
      }
    }
    if (current.status === "cancelado" && status !== "cancelado") {
      if (process.env.VERCEL) {
        const taken = withAdjustedVariantStock(
          liveProduct,
          variantId,
          -current.quantity,
        );
        if ("error" in taken) return { ...taken, http: 409 as const };
        writeTmpStock(current.productId, variantId, taken.stock);
      } else {
        const taken = adjustVariantStock(
          process.cwd(),
          current.productId,
          variantId,
          -current.quantity,
        );
        if ("error" in taken) return { ...taken, http: 409 as const };
      }
    }
  }

  const next = {
    ...current,
    status,
    variantId: current.variantId || variantId,
  };
  orders[index] = next;
  if (process.env.VERCEL) writeTmpOrders(orders);
  else writeSavedOrders(process.cwd(), orders);
  return { order: next };
}

export function resolveOrderVariantId(order: StoreOrder) {
  const product = catalogProducts().find((item) => item.id === order.productId);
  return orderVariantId(order, product);
}
