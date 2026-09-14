

export type StoreCartItem = {
  id: string; // unique key: `${productId}:${variantId}`
  productId: string;
  productTitle: string;
  productPrice: number;
  imageUrl: string;
  variantId: string;
  size: string;
  color: string;
  quantity: number;
  withoutStock: boolean;
  maxStock: number;
};

const CART_KEY = "jdj-store-cart-v2";

export function loadStoreCart(): StoreCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(CART_KEY) || localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoreCartItem[]) : [];
  } catch {
    return [];
  }
}

export function saveStoreCart(items: StoreCartItem[]) {
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(items);
    sessionStorage.setItem(CART_KEY, json);
    localStorage.setItem(CART_KEY, json);
    window.dispatchEvent(new CustomEvent("jdj-cart-update", { detail: items }));
  } catch {
    /* ignore */
  }
}

export function clearStoreCart() {
  saveStoreCart([]);
}
