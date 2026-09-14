import type {
  StoreOrder,
  StoreOrderStatus,
  StoreProduct,
  StoreVariant,
} from "../data/defaultContent.js";
import { getCountdown, parseEventDate } from "./dates.js";

export type CreateOrderInput = {
  name: string;
  email: string;
  phone: string;
  parish: string;
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
  revenue: number;
  orders: number;
};

export type OrderReportColorGroup = {
  color: string;
  sold: number;
  remaining: number;
  revenue: number;
  orders: number;
  lines: OrderReportLine[];
};

export type OrderReportProduct = {
  productId: string;
  productTitle: string;
  sold: number;
  remaining: number;
  revenue: number;
  orders: number;
  hasColors: boolean;
  groups: OrderReportColorGroup[];
  lines: OrderReportLine[];
};

export type OrderReportSize = {
  size: string;
  sold: number;
  remaining: number;
  orders: number;
};

export type OrderReport = {
  total: number;
  byStatus: Record<StoreOrderStatus, number>;
  units: number;
  revenue: number;
  productCount: number;
  products: OrderReportProduct[];
  sizes: OrderReportSize[];
  lines: OrderReportLine[];
};

const SIZE_RANK: Record<string, number> = {
  xxs: 0,
  xs: 1,
  s: 2,
  m: 3,
  l: 4,
  xl: 5,
  xxl: 6,
  "2xl": 6,
  xxxl: 7,
  "3xl": 7,
};

export function compareStoreSize(a: string, b: string) {
  const left = SIZE_RANK[a.trim().toLowerCase()];
  const right = SIZE_RANK[b.trim().toLowerCase()];
  if (left != null && right != null && left !== right) return left - right;
  if (left != null && right == null) return -1;
  if (left == null && right != null) return 1;
  return a.localeCompare(b, "es", { numeric: true });
}

type LegacyProduct = StoreProductInput;

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

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
  const num = Number(amount) || 0;
  if (Number.isInteger(num)) {
    return `$${num}`;
  }
  return `$${num.toFixed(2)}`;
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
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `JDJ-${stamp}${rand}`.slice(0, 28);
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

export const STORE_MYSTERY_SHIRT = "/images/store-mystery-shirt.webp";

export function isProductComingSoon(
  product: Pick<StoreProduct, "comingSoon" | "revealAt">,
  now = Date.now(),
) {
  if (!product.comingSoon) return false;
  if (!product.revealAt) return true;
  const date = parseEventDate(product.revealAt);
  if (!date) return true;
  return date.getTime() > now;
}

export function productRevealLabel(
  product: Pick<StoreProduct, "revealAt">,
  now = Date.now(),
) {
  if (!product.revealAt) return "";
  const date = parseEventDate(product.revealAt);
  if (!date) return "";
  const parts = getCountdown(date, now);
  if (parts.total <= 0) return "";
  if (parts.days > 1) return `Aparece en ${parts.days} días`;
  if (parts.days === 1) return "Aparece mañana";
  if (parts.hours > 1) return `Aparece en ${parts.hours} horas`;
  return "Aparece muy pronto";
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
  if (product.withoutStock) return product.variants[0];
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
  const nextStock = Math.max(0, product.variants[index].stock + delta);
  if (!product.withoutStock && product.variants[index].stock + delta < 0) {
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

  const comingSoon = Boolean(raw.comingSoon);
  const revealAt = String(raw.revealAt || "").trim();
  const withoutStock = Boolean(raw.withoutStock);
  const section = String(raw.section || "JDJ").trim().toUpperCase() || "JDJ";

  if (Array.isArray(raw.variants) && raw.variants.length) {
    return {
      id,
      title,
      description,
      price,
      imageUrl,
      imageUrls,
      comingSoon,
      revealAt,
      withoutStock,
      section,
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
    comingSoon,
    revealAt,
    withoutStock,
    section,
    variants: sizes.map((size, index) => ({
      id: makeVariantId(id, size, ""),
      size,
      color: "",
      stock: base + (index === 0 ? remainder : 0),
    })),
  };
}

export function sortProductsBySection(products: StoreProduct[]): StoreProduct[] {
  const sectionPriority = (sec?: string) => {
    const clean = String(sec || "JDJ").trim().toUpperCase();
    if (clean === "JDJ") return 1;
    if (clean === "PJA") return 2;
    return 3;
  };

  return [...products].sort((a, b) => {
    const prioA = sectionPriority(a.section);
    const prioB = sectionPriority(b.section);
    if (prioA !== prioB) return prioA - prioB;
    return 0;
  });
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
  const parish = String(body.parish ?? body.parroquia ?? "").trim();
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
  if (parish.length < 2) {
    return { error: "Escribe tu Parroquia o Movimiento." };
  }
  if (!productId || !/^[a-z0-9][a-z0-9_-]{1,79}$/i.test(productId)) {
    return { error: "Falta el producto." };
  }
  if (variantId && !/^[a-z0-9][a-z0-9_-]{1,79}$/i.test(variantId)) {
    return { error: "La variante no es válida." };
  }
  if (size.length > 24 || color.length > 40 || note.length > 280) {
    return { error: "Hay un dato demasiado largo." };
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { error: "La cantidad debe ser al menos 1." };
  }
  if (quantity > 20) return { error: "La cantidad máxima por pedido es 20." };

  return {
    name,
    email,
    phone,
    parish,
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
  if (!product.withoutStock) {
    if (variant.stock <= 0) {
      return { error: `${variantLabel(variant)} está agotada.` };
    }
    if (input.quantity > variant.stock) {
      return {
        error: `Solo quedan ${variant.stock} unidad(es) de ${variantLabel(variant)}.`,
      };
    }
  }

  const unitPrice = Number(product.price) || 0;
  return {
    id,
    createdAt: new Date().toISOString(),
    name: input.name,
    email: input.email,
    phone: input.phone,
    parish: String(input.parish ?? (input as any).parroquia ?? "").trim(),
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

function emptyReportLine(
  productId: string,
  productTitle: string,
  variantId: string,
  size: string,
  color: string,
  remaining: number,
): OrderReportLine {
  return {
    productId,
    productTitle,
    variantId,
    size,
    color,
    sold: 0,
    remaining,
    revenue: 0,
    orders: 0,
  };
}

function sortReportLines(lines: OrderReportLine[]) {
  return [...lines].sort((a, b) => {
    const product = a.productTitle.localeCompare(b.productTitle, "es");
    if (product) return product;
    const color = a.color.localeCompare(b.color, "es");
    if (color) return color;
    return compareStoreSize(a.size, b.size);
  });
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
    const product = products.find((item) => item.id === order.productId);
    const variant = product ? findVariant(product, order) : undefined;
    const variantId =
      variant?.id ||
      order.variantId ||
      `${order.productId}:${order.color}:${order.size}`;
    const key = `${order.productId}::${variantId}`;
    const current =
      sold.get(key) ??
      emptyReportLine(
        order.productId,
        order.productTitle,
        variantId,
        variant?.size || order.size,
        variant?.color || order.color || "",
        variant?.stock ?? 0,
      );
    if (order.status !== "cancelado") {
      units += order.quantity;
      revenue += order.total;
      current.sold += order.quantity;
      current.revenue += order.total;
      current.orders += 1;
    }
    current.remaining = variant?.stock ?? current.remaining;
    sold.set(key, current);
  }

  for (const product of products) {
    for (const variant of product.variants) {
      const key = `${product.id}::${variant.id}`;
      if (sold.has(key)) continue;
      sold.set(
        key,
        emptyReportLine(
          product.id,
          product.title,
          variant.id,
          variant.size,
          variant.color,
          variant.stock,
        ),
      );
    }
  }

  const lines = sortReportLines([...sold.values()]);
  const productMap = new Map<string, OrderReportProduct>();

  for (const line of lines) {
    const current = productMap.get(line.productId) ?? {
      productId: line.productId,
      productTitle: line.productTitle,
      sold: 0,
      remaining: 0,
      revenue: 0,
      orders: 0,
      hasColors: false,
      groups: [],
      lines: [],
    };
    current.sold += line.sold;
    current.remaining += line.remaining;
    current.revenue += line.revenue;
    current.orders += line.orders;
    if (line.color) current.hasColors = true;
    current.lines.push(line);
    productMap.set(line.productId, current);
  }

  const reportProducts = [...productMap.values()].map((product) => {
    const colorMap = new Map<string, OrderReportColorGroup>();
    for (const line of product.lines) {
      const current = colorMap.get(line.color) ?? {
        color: line.color,
        sold: 0,
        remaining: 0,
        revenue: 0,
        orders: 0,
        lines: [],
      };
      current.sold += line.sold;
      current.remaining += line.remaining;
      current.revenue += line.revenue;
      current.orders += line.orders;
      current.lines.push(line);
      colorMap.set(line.color, current);
    }
    const groups = [...colorMap.values()]
      .map((group) => ({
        ...group,
        lines: [...group.lines].sort((a, b) => compareStoreSize(a.size, b.size)),
      }))
      .sort((a, b) => a.color.localeCompare(b.color, "es"));
    return { ...product, groups };
  });

  reportProducts.sort((a, b) => {
    if (b.sold !== a.sold) return b.sold - a.sold;
    return a.productTitle.localeCompare(b.productTitle, "es");
  });

  const sizeMap = new Map<string, OrderReportSize>();
  for (const line of lines) {
    const size = line.size || "Única";
    const current = sizeMap.get(size) ?? {
      size,
      sold: 0,
      remaining: 0,
      orders: 0,
    };
    current.sold += line.sold;
    current.remaining += line.remaining;
    current.orders += line.orders;
    sizeMap.set(size, current);
  }

  const sizes = [...sizeMap.values()].sort((a, b) =>
    compareStoreSize(a.size, b.size),
  );

  return {
    total: orders.length,
    byStatus,
    units,
    revenue,
    productCount: reportProducts.filter((item) => item.sold > 0).length,
    products: reportProducts,
    sizes,
    lines,
  };
}

export function buildMultiItemStoreOrder(
  input: {
    name: string;
    email: string;
    phone: string;
    parish: string;
    note: string;
    items: Array<{
      productId: string;
      productTitle?: string;
      variantId?: string;
      size: string;
      color: string;
      quantity: number;
      productPrice?: number;
    }>;
  },
  products: StoreProduct[],
  id = createOrderId(),
): StoreOrder | { error: string } {
  const orderItems: Array<{
    productId: string;
    productTitle: string;
    variantId: string;
    size: string;
    color: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }> = [];

  let grandTotal = 0;
  let grandQty = 0;

  for (const raw of input.items) {
    const product = products.find((p) => p.id === raw.productId);
    if (!product) return { error: `Producto no encontrado (${raw.productId}).` };
    const variant = findVariant(product, raw);
    if (!variant) return { error: `Talla/color no disponible en ${product.title}.` };
    if (!product.withoutStock && variant.stock < raw.quantity) {
      return { error: `Solo quedan ${variant.stock} ud. de ${product.title} (${variantLabel(variant)}).` };
    }
    const unitPrice = Number(product.price) || Number(raw.productPrice) || 0;
    const subtotal = unitPrice * raw.quantity;
    orderItems.push({
      productId: product.id,
      productTitle: product.title,
      variantId: variant.id,
      size: variant.size,
      color: variant.color,
      quantity: raw.quantity,
      unitPrice,
      total: subtotal,
    });
    grandTotal += subtotal;
    grandQty += raw.quantity;
  }

  if (!orderItems.length) return { error: "El pedido debe contener al menos un producto." };

  const primaryItem = orderItems[0];
  const summaryTitle =
    orderItems.length === 1
      ? primaryItem.productTitle
      : `${orderItems.length} prendas (${orderItems.map((i) => i.productTitle).join(", ")})`;

  return {
    id,
    createdAt: new Date().toISOString(),
    name: input.name,
    email: input.email,
    phone: input.phone,
    parish: String(input.parish ?? (input as any).parroquia ?? "").trim(),
    productId: primaryItem.productId,
    productTitle: summaryTitle,
    variantId: primaryItem.variantId,
    size: orderItems.map((i) => i.size).filter(Boolean).join(", ") || "Única",
    color: orderItems.map((i) => i.color).filter(Boolean).join(", "),
    quantity: grandQty,
    unitPrice: primaryItem.unitPrice,
    total: grandTotal,
    payment: "Transferencia",
    note: input.note,
    status: "nuevo",
    items: orderItems,
  };
}

export function buildOrderMessage(order: StoreOrder) {
  const lines = [
    `Hola, quiero confirmar mi pedido para la JDJ Jayaque 2026:`,
    "",
    `📌 *Código:* ${order.id}`,
    `👤 *Nombre:* ${order.name}`,
    `📞 *Teléfono:* ${order.phone}`,
    `📧 *Correo:* ${order.email}`,
    `⛪ *Parroquia / Grupo:* ${order.parish}`,
    "",
  ];

  if (order.items && order.items.length > 0) {
    lines.push(`👕 *PRENDAS SOLICITADAS:*`);
    for (const item of order.items) {
      lines.push(
        `• ${item.productTitle}${item.color ? ` (${item.color})` : ""} - Talla ${item.size || "Única"} x${item.quantity}: ${formatUsd(item.total)}`,
      );
    }
  } else {
    lines.push(`👕 *PRENDA:* ${order.productTitle}`);
    if (order.color) lines.push(`Color: ${order.color}`);
    if (order.size) lines.push(`Talla: ${order.size}`);
    lines.push(`Cantidad: ${order.quantity}`);
  }

  lines.push(
    "",
    `💰 *TOTAL A PAGAR:* ${formatUsd(order.total)}`,
    `💳 *Método de Pago:* Transferencia Bancaria`,
  );
  if (order.note) lines.push(`📝 *Indicaciones:* ${order.note}`);
  lines.push("", `Por favor confírmenme el seguimiento y los datos bancarios para realizar el pago. ¡Muchas gracias!`);
  return lines.join("\n");
}

export function whatsappOrderUrl(whatsapp: string, order: StoreOrder) {
  const phone = normalizeWhatsapp(whatsapp);
  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildOrderMessage(order))}`;
}

export function buildMultiOrderMessage(
  orders: StoreOrder[],
  contact: { name: string; email: string; phone: string; parish: string; note?: string },
) {
  const grandTotal = orders.reduce((sum, item) => sum + item.total, 0);
  const totalQty = orders.reduce((sum, item) => sum + item.quantity, 0);
  const lines = [
    `Hola, quiero hacer un pedido de la Tienda JDJ 2026.`,
    "",
    `Nombre: ${contact.name}`,
    `Correo: ${contact.email}`,
    `Teléfono: ${contact.phone}`,
    `Parroquia / Movimiento: ${contact.parish}`,
    "",
    `Resumen del pedido (${totalQty} ${totalQty === 1 ? "unidad" : "unidades"}):`,
    ...orders.map(
      (item) =>
        `• ${item.productTitle}${item.color ? ` (${item.color})` : ""} - Talla ${item.size || "Única"}: ${item.quantity} ud. (${formatUsd(item.total)})`,
    ),
    "",
    `Total a pagar: ${formatUsd(grandTotal)}`,
    `Pago: Transferencia`,
    "",
    `* Nota: El envío no está incluido en el precio y se coordinará por WhatsApp si es necesario.`,
  ];
  if (contact.note) lines.push(`* Indicaciones: ${contact.note}`);
  return lines.join("\n");
}

export function whatsappMultiOrderUrl(
  whatsapp: string,
  orders: StoreOrder[],
  contact: { name: string; email: string; phone: string; parish: string; note?: string },
) {
  const phone = normalizeWhatsapp(whatsapp);
  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildMultiOrderMessage(orders, contact))}`;
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
