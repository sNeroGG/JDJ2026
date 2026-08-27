import { eqFilter } from "./safe.js";

const DONATION_COLUMNS =
  "id,full_name,dui,email,phone,parish,amount,status,payment_method,paid_at,created_at";

function config() {
  const url = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) {
    throw new Error(
      "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el servidor.",
    );
  }
  return { url, key };
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
  const payload = text ? (JSON.parse(text) as unknown) : null;
  if (!remote.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: string }).message)
        : `Supabase ${remote.status}`;
    throw new Error(message);
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
  return rows[0];
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
  return rows[0] ?? null;
}

export async function listDonations() {
  return rest<Record<string, unknown>[]>(
    `donations?select=${DONATION_COLUMNS}&order=created_at.desc`,
  );
}
