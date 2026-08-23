import type {
  StoreOrder,
  StoreOrderStatus,
  StoreProduct,
  StoreVariant,
} from "../data/defaultContent.js";

export type CreateOrderInput = {
  name: string;
  email: string;
  phone: string;
  productId: string;
  variantId: string;
  size: string;
  color: string;
  quantity: number;
  note: string;
};

export type StoreStockMap = Record<string, Record<string, number>>;

export type StoreProductInput = Partial<StoreProduct> & {
  id?: string;
  stock?: number;
  sizes?: string[];
};

export type OrderReportLine = {
  productId: string;
  productTitle: string;
  variantId: string;
  size: string;
  color: string;
  sold: number;
  remaining: number;
};

export type OrderReport = {
  total: number;
  byStatus: Record<StoreOrderStatus, number>;
  units: number;
  revenue: number;
  lines: OrderReportLine[];
};

type LegacyProduct = StoreProductInput;

const DEFAULT_SIZES = ["S", "M", "L", "XL"];

export function digitsOnly(value: string) {
  return String(value || "").replace(/\D/g, "");
}

/** Número de WhatsApp con código de país. 8 dígitos locales se anteponen 503. */
export function normalizeWhatsapp(value: string) {
  let digits = digitsOnly(value);
  if (digits.length === 8) digits = `503${digits}`;
  return digits;
}

export function formatUsd(amount: number) {
  return new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatOrderDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function createOrderId() {
  return `JDJ-${Date.now().toString(36).toUpperCase()}`;
}

export function makeVariantId(productId: string, size: string, color: string) {
  const token = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unica";
  return `${productId}--${token(color)}--${token(size)}`;
}

export function defaultProductVariants(productId: string): StoreVariant[] {
  return DEFAULT_SIZES.map((size) => ({
    id: makeVariantId(productId, size, ""),
    size,
    color: "",
    stock: 0,
  }));
}

export function variantLabel(variant: Pick<StoreVariant, "size" | "color">) {
  return [variant.color, variant.size].filter(Boolean).join(" · ") || "Única";
}

export function productStock(product: Pick<StoreProduct, "variants">) {
  return product.variants.reduce((sum, item) => sum + Math.max(0, item.stock), 0);
}

export function productColors(product: Pick<StoreProduct, "variants">) {
  return unique(product.variants.map((item) => item.color.trim()).filter(Boolean));
}

export function productSizes(
  product: Pick<StoreProduct, "variants">,
  color = "",
) {
  return unique(
    product.variants
      .filter((item) => !color || item.color === color)
      .map((item) => item.size.trim())
      .filter(Boolean),
  );
}

export function findVariant(
  product: Pick<StoreProduct, "variants">,
  input: { variantId?: string; size?: string; color?: string },
) {
  if (input.variantId) {
    const byId = product.variants.find((item) => item.id === input.variantId);
    if (byId) return byId;
  }
  const size = String(input.size ?? "").trim();
  const color = String(input.color ?? "").trim();
  return (
    product.variants.find(
      (item) => item.size === size && item.color === color,
    ) ||
    (size
      ? product.variants.find((item) => item.size === size && !item.color)
      : undefined)
  );
}

export function firstAvailableVariant(product: StoreProduct) {
  return product.variants.find((item) => item.stock > 0) ?? product.variants[0];
}

export function applyStockMap(
  products: StoreProduct[],
  stock: StoreStockMap | null | undefined,
) {
  if (!stock) return products;
  return products.map((product) => {
    const overlay = stock[product.id];
    if (!overlay) return product;
    return {
      ...product,
      variants: product.variants.map((variant) => ({
        ...variant,
        stock: overlay[variant.id] ?? variant.stock,
      })),
    };
  });
}

export function stockMapFromProducts(products: StoreProduct[]): StoreStockMap {
  return Object.fromEntries(
    products.map((product) => [
      product.id,
      Object.fromEntries(
        product.variants.map((variant) => [variant.id, variant.stock]),
      ),
    ]),
  );
}

export function withAdjustedVariantStock(
  product: StoreProduct,
  variantId: string,
  delta: number,
): { product: StoreProduct; stock: number; total: number } | { error: string } {
  const index = product.variants.findIndex((item) => item.id === variantId);
  if (index < 0) return { error: "No se encontró esa talla o color." };
  const nextStock = product.variants[index].stock + delta;
  if (nextStock < 0) {
    return {
      error: `Solo quedan ${product.variants[index].stock} unidad(es) de ${variantLabel(product.variants[index])}.`,
    };
  }
  const variants = product.variants.map((item, i) =>
    i === index ? { ...item, stock: nextStock } : item,
  );
  const next = { ...product, variants };
  return { product: next, stock: nextStock, total: productStock(next) };
}

export function productImages(
  product: Pick<StoreProduct, "imageUrl" | "imageUrls"> | StoreProductInput,
) {
  const listed = Array.isArray(product.imageUrls) ? product.imageUrls : [];
  return unique(
    [...listed, product.imageUrl]
      .map((item) => String(item || "").trim())
      .filter((item) => item && !item.startsWith("data:")),
  );
}

export function withProductGallery(
  product: StoreProduct,
  imageUrls: string[],
): StoreProduct {
  const urls = productImages({ imageUrl: "", imageUrls });
  return { ...product, imageUrls: urls, imageUrl: urls[0] || "" };
}

export function normalizeStoreProduct(
  raw: LegacyProduct,
  fallbackId = "prod",
): StoreProduct {
  const id = String(raw.id || fallbackId);
  const title = String(raw.title || "Producto");
  const description = String(raw.description || "");
  const price = Number(raw.price) || 0;
  const imageUrls = productImages(raw);
  const imageUrl = imageUrls[0] || "";

  if (Array.isArray(raw.variants) && raw.variants.length) {
    return {
      id,
      title,
      description,
      price,
      imageUrl,
      imageUrls,
      variants: raw.variants.map((variant, index) =>
        normalizeVariant(id, variant, index),
      ),
    };
  }

  const sizes = Array.isArray(raw.sizes) && raw.sizes.length
    ? unique(raw.sizes.map((item) => String(item).trim()).filter(Boolean))
    : [...DEFAULT_SIZES];
  const leftover = Math.max(0, Number(raw.stock) || 0);
  const base = Math.floor(leftover / sizes.length);
  const remainder = leftover % sizes.length;

  return {
    id,
    title,
    description,
    price,
    imageUrl,
    imageUrls,
    variants: sizes.map((size, index) => ({
      id: makeVariantId(id, size, ""),
      size,
      color: "",
      stock: base + (index === 0 ? remainder : 0),
    })),
  };
}

export function normalizeStoreProducts(products: LegacyProduct[] | undefined) {
  if (!Array.isArray(products)) return [];
  return products.map((item, index) =>
    normalizeStoreProduct(item, `prod-${index + 1}`),
  );
}

export function parseCreateOrder(
  body: Record<string, unknown>,
): CreateOrderInput | { error: string } {
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = digitsOnly(String(body.phone ?? ""));
  const productId = String(body.productId ?? "").trim();
  const variantId = String(body.variantId ?? "").trim();
  const size = String(body.size ?? "").trim();
  const color = String(body.color ?? "").trim();
  const note = String(body.note ?? "").trim();
  const quantity = Number(body.quantity);

  if (name.length < 2) return { error: "Escribe tu nombre." };
  if (!email.includes("@") || email.length < 6) {
    return { error: "Escribe un correo válido." };
  }
  if (phone.length < 8) return { error: "Escribe un número de teléfono." };
  if (!productId) return { error: "Falta el producto." };
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { error: "La cantidad debe ser al menos 1." };
  }
  if (quantity > 20) return { error: "La cantidad máxima por pedido es 20." };

  return {
    name,
    email,
    phone,
    productId,
    variantId,
    size,
    color,
    quantity,
    note,
  };
}

export function buildStoreOrder(
  input: CreateOrderInput,
  product: StoreProduct,
  id = createOrderId(),
): StoreOrder | { error: string } {
  const variant = findVariant(product, input);
  if (!variant) {
    const needsSize = productSizes(product).length > 0;
    const needsColor = productColors(product).length > 0;
    if (needsColor && !input.color) return { error: "Elige un color." };
    if (needsSize && !input.size) return { error: "Elige una talla." };
    return { error: "Esa talla o color no está disponible." };
  }
  if (variant.stock <= 0) {
    return { error: `${variantLabel(variant)} está agotada.` };
  }
  if (input.quantity > variant.stock) {
    return {
      error: `Solo quedan ${variant.stock} unidad(es) de ${variantLabel(variant)}.`,
    };
  }

  const unitPrice = Number(product.price) || 0;
  return {
    id,
    createdAt: new Date().toISOString(),
    name: input.name,
    email: input.email,
    phone: input.phone,
    productId: product.id,
    productTitle: product.title,
    variantId: variant.id,
    size: variant.size,
    color: variant.color,
    quantity: input.quantity,
    unitPrice,
    total: unitPrice * input.quantity,
    payment: "Transferencia",
    note: input.note,
    status: "nuevo",
  };
}

export function orderVariantId(order: StoreOrder, product?: StoreProduct) {
  if (order.variantId) return order.variantId;
  if (!product) return "";
  return findVariant(product, order)?.id || "";
}

export function buildOrderReport(
  orders: StoreOrder[],
  products: StoreProduct[],
): OrderReport {
  const byStatus: Record<StoreOrderStatus, number> = {
    nuevo: 0,
    atendido: 0,
    cancelado: 0,
  };
  let units = 0;
  let revenue = 0;
  const sold = new Map<string, OrderReportLine>();

  for (const order of orders) {
    byStatus[order.status] += 1;
    if (order.status === "cancelado") continue;
    units += order.quantity;
    revenue += order.total;
    const product = products.find((item) => item.id === order.productId);
    const variant = product ? findVariant(product, order) : undefined;
    const variantId = variant?.id || order.variantId || `${order.productId}:${order.color}:${order.size}`;
    const key = `${order.productId}::${variantId}`;
    const current = sold.get(key) ?? {
      productId: order.productId,
      productTitle: order.productTitle,
      variantId,
      size: variant?.size || order.size,
      color: variant?.color || order.color || "",
      sold: 0,
      remaining: variant?.stock ?? 0,
    };
    current.sold += order.quantity;
    current.remaining = variant?.stock ?? current.remaining;
    sold.set(key, current);
  }

  for (const product of products) {
    for (const variant of product.variants) {
      const key = `${product.id}::${variant.id}`;
      if (sold.has(key)) continue;
      sold.set(key, {
        productId: product.id,
        productTitle: product.title,
        variantId: variant.id,
        size: variant.size,
        color: variant.color,
        sold: 0,
        remaining: variant.stock,
      });
    }
  }

  const lines = [...sold.values()].sort((a, b) => {
    const product = a.productTitle.localeCompare(b.productTitle, "es");
    if (product) return product;
    const color = a.color.localeCompare(b.color, "es");
    if (color) return color;
    return a.size.localeCompare(b.size, "es");
  });

  return {
    total: orders.length,
    byStatus,
    units,
    revenue,
    lines,
  };
}

export function buildOrderMessage(order: StoreOrder) {
  const lines = [
    `Hola, quiero hacer un pedido de la Tienda JDJ 2026.`,
    "",
    `Pedido: ${order.id}`,
    `Nombre: ${order.name}`,
    `Correo: ${order.email}`,
    `Teléfono: ${order.phone}`,
    `Producto: ${order.productTitle}`,
  ];
  if (order.color) lines.push(`Color: ${order.color}`);
  if (order.size) lines.push(`Talla: ${order.size}`);
  lines.push(
    `Cantidad: ${order.quantity}`,
    `Total: ${formatUsd(order.total)}`,
    `Pago: Transferencia`,
  );
  if (order.note) lines.push("", `Nota: ${order.note}`);
  return lines.join("\n");
}

export function whatsappOrderUrl(whatsapp: string, order: StoreOrder) {
  const phone = normalizeWhatsapp(whatsapp);
  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildOrderMessage(order))}`;
}

function normalizeVariant(
  productId: string,
  variant: Partial<StoreVariant>,
  index: number,
): StoreVariant {
  const size = String(variant.size || "").trim();
  const color = String(variant.color || "").trim();
  return {
    id: String(variant.id || makeVariantId(productId, size || `v${index}`, color)),
    size,
    color,
    stock: Math.max(0, Number(variant.stock) || 0),
  };
}

function unique(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}
