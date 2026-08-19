import type { StoreOrder, StoreProduct } from "../data/defaultContent.ts";

export type CreateOrderInput = {
  name: string;
  email: string;
  phone: string;
  productId: string;
  size: string;
  quantity: number;
  note: string;
};

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

export function parseCreateOrder(
  body: Record<string, unknown>,
): CreateOrderInput | { error: string } {
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = digitsOnly(String(body.phone ?? ""));
  const productId = String(body.productId ?? "").trim();
  const size = String(body.size ?? "").trim();
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

  return { name, email, phone, productId, size, quantity, note };
}

export function buildStoreOrder(
  input: CreateOrderInput,
  product: StoreProduct,
  id = createOrderId(),
): StoreOrder | { error: string } {
  if (product.stock <= 0) return { error: "Este producto está agotado." };
  if (input.quantity > product.stock) {
    return {
      error: `Solo quedan ${product.stock} unidad(es) de este producto.`,
    };
  }
  if (product.sizes.length && !product.sizes.includes(input.size)) {
    return { error: "Elige una talla." };
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
    size: input.size,
    quantity: input.quantity,
    unitPrice,
    total: unitPrice * input.quantity,
    payment: "Transferencia",
    note: input.note,
    status: "nuevo",
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
