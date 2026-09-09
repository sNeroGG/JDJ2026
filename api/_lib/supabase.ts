import type { StoreOrder, StoreOrderStatus, StoreProduct } from "../../src/data/defaultContent.js";
import { normalizeDonationRecord } from "../../src/utils/donations.js";
import type { StoreStockMap } from "../../src/utils/store.js";
import { eqFilter } from "./safe.js";

const DONATION_COLUMNS =
  "id,full_name,dui,email,phone,parish,amount,status,payment_method,paid_at,created_at";

const ORDER_COLUMNS =
  "id,created_at,name,email,phone,product_id,product_title,variant_id,size,color,quantity,unit_price,total,payment,note,status";

export class StoreConflictError extends Error {
  remaining?: number;
  constructor(message: string, remaining?: number) {
    super(message);
    this.name = "StoreConflictError";
    this.remaining = remaining;
  }
}

export function isSupabaseConfigured() {
  const env = supabaseEnv();
  return env.hasUrl && env.hasKey;
}

function readEnv(name: string) {
  return String(process.env[name] || "").trim();
}

export function supabaseEnv() {
  const rawUrl = readEnv("SUPABASE_URL");
  const key =
    readEnv("SUPABASE_SERVICE_ROLE_KEY") || readEnv("SERVICE_ROLE_KEY");
  let url = rawUrl.replace(/\/+$/, "");
  const hadRestPath = /\/rest\/v1$/i.test(url);
  url = url.replace(/\/rest\/v1$/i, "").replace(/\/+$/, "");

  let host = "";
  try {
    if (url) host = new URL(url).host;
  } catch {
    host = "";
  }

  const hints: string[] = [];
  if (!rawUrl) {
    hints.push(
      "Falta SUPABASE_URL. En Vercel el nombre exacto es SUPABASE_URL y el valor es https://xxxx.supabase.co (sin /rest/v1).",
    );
  } else if (!host) {
    hints.push(
      "SUPABASE_URL no es válida. Debe ser https://xxxx.supabase.co sin /rest/v1.",
    );
  } else if (hadRestPath) {
    hints.push(
      "Se ignoró /rest/v1 al final de la URL. Deja solo https://xxxx.supabase.co.",
    );
  }
  if (!key) {
    hints.push(
      "Falta la clave. El nombre de la variable debe ser SUPABASE_SERVICE_ROLE_KEY (no SERVICE_ROLE_KEY) y el valor es la clave service_role, no la anon.",
    );
  }

  return {
    url,
    key,
    host,
    hasUrl: Boolean(url && host),
    hasKey: Boolean(key),
    hint: hints.join(" "),
  };
}

function config() {
  const env = supabaseEnv();
  if (!env.url || !env.key) {
    throw new Error(
      env.hint ||
        "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el servidor.",
    );
  }
  return env;
}

function rpcMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload) {
    return String((payload as { message: string }).message);
  }
  return fallback;
}

function throwStoreError(message: string): never {
  if (/could not find the function|relation .* does not exist/i.test(message)) {
    throw new Error(
      "Supabase está conectado, pero faltan las tablas. Corre supabase/schema.sql en el SQL Editor y vuelve a intentar.",
    );
  }
  if (message.startsWith("STOCK_INSUFFICIENT")) {
    const leftover = Number(message.split(":")[1]);
    const remaining = Number.isFinite(leftover) ? leftover : undefined;
    throw new StoreConflictError(
      remaining == null
        ? "Ya no hay suficientes unidades de esa talla o color."
        : `Solo quedan ${remaining} unidad(es) de esa talla o color.`,
      remaining,
    );
  }
  if (message === "ORDER_NOT_FOUND") {
    throw new StoreConflictError("Pedido no encontrado.");
  }
  if (message === "ORDER_INVALID" || message === "STOCK_NOT_FOUND") {
    throw new StoreConflictError("No se pudo actualizar el pedido.");
  }
  throw new Error(message);
}

async function rest<T>(
  path: string,
  init: RequestInit & { prefer?: string } = {},
): Promise<T> {
  const { url, key } = config();
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.prefer) headers.Prefer = init.prefer;
  const remote = await fetch(`${url}/rest/v1/${path}`, { ...init, headers });
  const text = await remote.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text.slice(0, 240) };
    }
  }
  if (!remote.ok) {
    throwStoreError(rpcMessage(payload, `Supabase ${remote.status}`));
  }
  return payload as T;
}

export async function insertDonation(row: Record<string, unknown>) {
  const rows = await rest<Record<string, unknown>[]>(
    `donations?select=${DONATION_COLUMNS}`,
    {
      method: "POST",
      body: JSON.stringify(row),
      prefer: "return=representation",
    },
  );
  return normalizeDonationRecord(rows[0]) ?? rows[0];
}

export async function updateDonation(
  id: string,
  patch: Record<string, unknown>,
) {
  const filter = eqFilter("id", id);
  if (!filter) return null;
  const rows = await rest<Record<string, unknown>[]>(
    `donations?${filter}&select=${DONATION_COLUMNS}`,
    {
      method: "PATCH",
      body: JSON.stringify(patch),
      prefer: "return=representation",
    },
  );
  return normalizeDonationRecord(rows[0] ?? undefined);
}

export async function listDonations() {
  const rows = await rest<Record<string, unknown>[]>(
    `donations?select=${DONATION_COLUMNS}&order=created_at.desc`,
  );
  return (rows || [])
    .map((row) => normalizeDonationRecord(row))
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
}

function orderFromRow(row: Record<string, unknown>): StoreOrder {
  const status = String(row.status || "nuevo");
  return {
    id: String(row.id || ""),
    createdAt: String(row.created_at || ""),
    name: String(row.name || ""),
    email: String(row.email || ""),
    phone: String(row.phone || ""),
    productId: String(row.product_id || ""),
    productTitle: String(row.product_title || ""),
    variantId: String(row.variant_id || ""),
    size: String(row.size || ""),
    color: String(row.color || ""),
    quantity: Number(row.quantity) || 0,
    unitPrice: Number(row.unit_price) || 0,
    total: Number(row.total) || 0,
    payment: "Transferencia",
    note: String(row.note || ""),
    status:
      status === "atendido" || status === "cancelado" ? status : "nuevo",
  };
}

function orderToPayload(order: StoreOrder) {
  return {
    id: order.id,
    created_at: order.createdAt,
    name: order.name,
    email: order.email,
    phone: order.phone,
    product_id: order.productId,
    product_title: order.productTitle,
    variant_id: order.variantId,
    size: order.size,
    color: order.color,
    quantity: order.quantity,
    unit_price: order.unitPrice,
    total: order.total,
    payment: order.payment,
    note: order.note,
    status: order.status,
  };
}

export async function ensureStoreStock(products: StoreProduct[]) {
  const rows = products.flatMap((product) =>
    product.variants.map((variant) => ({
      product_id: product.id,
      variant_id: variant.id,
      stock: Math.max(0, variant.stock),
    })),
  );
  if (!rows.length) return;
  await rest("rpc/ensure_store_stock", {
    method: "POST",
    body: JSON.stringify({ p_rows: rows }),
  });
}

export async function listStoreStock(): Promise<StoreStockMap> {
  const rows = await rest<
    { product_id: string; variant_id: string; stock: number }[]
  >("store_stock?select=product_id,variant_id,stock");
  const map: StoreStockMap = {};
  for (const row of rows || []) {
    const productId = String(row.product_id || "");
    const variantId = String(row.variant_id || "");
    if (!productId || !variantId) continue;
    map[productId] ??= {};
    map[productId][variantId] = Math.max(0, Number(row.stock) || 0);
  }
  return map;
}

export async function listStoreOrders() {
  const rows = await rest<Record<string, unknown>[]>(
    `store_orders?select=${ORDER_COLUMNS}&order=created_at.desc`,
  );
  return (rows || []).map(orderFromRow);
}

export async function placeStoreOrder(order: StoreOrder, seed: number) {
  const placed = await rest<{ stock?: number }>("rpc/place_store_order", {
    method: "POST",
    body: JSON.stringify({
      p_order: orderToPayload(order),
      p_seed: Math.max(0, seed),
    }),
  });
  return {
    order,
    stock: Number(placed?.stock),
  };
}

export async function updateStoreOrderStatus(
  id: string,
  status: StoreOrderStatus,
) {
  const row = await rest<Record<string, unknown>>(
    "rpc/update_store_order_status",
    {
      method: "POST",
      body: JSON.stringify({ p_id: id, p_status: status }),
    },
  );
  if (!row || typeof row !== "object") return null;
  return orderFromRow(row);
}

export type DbTableCheck = {
  key: string;
  label: string;
  ok: boolean;
  error?: string;
};

export async function probeSupabase() {
  const env = supabaseEnv();
  const base = {
    hasUrl: env.hasUrl,
    hasKey: env.hasKey,
    host: env.host || null,
    hint: env.hint || "",
  };

  if (!env.hasUrl || !env.hasKey) {
    return {
      ...base,
      configured: false,
      ok: false,
      message: env.hint || "Faltan variables de Supabase en el servidor.",
      checks: [] as DbTableCheck[],
    };
  }

  const tables = [
    {
      key: "donations",
      label: "Donaciones",
      path: "donations?select=id&limit=1",
    },
    {
      key: "store_orders",
      label: "Pedidos",
      path: "store_orders?select=id&limit=1",
    },
    {
      key: "store_stock",
      label: "Stock",
      path: "store_stock?select=product_id&limit=1",
    },
  ];

  const checks: DbTableCheck[] = [];
  for (const table of tables) {
    try {
      await rest(table.path, { method: "GET" });
      checks.push({ key: table.key, label: table.label, ok: true });
    } catch (error) {
      const raw = error instanceof Error ? error.message : "No se pudo consultar.";
      let errorText = raw;
      if (/Invalid API key|JWT|JWSError|unauthorized/i.test(raw)) {
        errorText =
          "La clave no es válida. Usa service_role (secret), no anon, en SUPABASE_SERVICE_ROLE_KEY.";
      }
      checks.push({
        key: table.key,
        label: table.label,
        ok: false,
        error: errorText,
      });
    }
  }

  const ok = checks.every((item) => item.ok);
  const failed = checks.filter((item) => !item.ok);
  return {
    ...base,
    configured: true,
    ok,
    message: ok
      ? `Conexión correcta con ${env.host}. Donaciones, pedidos y stock responden.`
      : failed.length === 1
        ? `${failed[0].label}: ${failed[0].error}`
        : `Hay ${failed.length} errores. ${failed.map((item) => item.label).join(", ")}.`,
    checks,
  };
}
