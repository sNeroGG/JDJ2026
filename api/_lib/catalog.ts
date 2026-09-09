import { SAVED_CONTENT } from "../../src/data/savedContent.js";
import { SAVED_ORDERS } from "../../src/data/savedOrders.js";
import type { StoreOrder, StoreProduct } from "../../src/data/defaultContent.js";
import { normalizeStoreProducts } from "../../src/utils/store.js";

export function productsFromBundle(): StoreProduct[] {
  const store = (
    SAVED_CONTENT as { store?: { products?: StoreProduct[] } }
  ).store;
  return normalizeStoreProducts(store?.products);
}

export function storeWhatsapp() {
  const store = (SAVED_CONTENT as { store?: { whatsapp?: string } }).store;
  return String(store?.whatsapp || "");
}

export function bundledOrders(): StoreOrder[] {
  return Array.isArray(SAVED_ORDERS) ? [...SAVED_ORDERS] : [];
}
