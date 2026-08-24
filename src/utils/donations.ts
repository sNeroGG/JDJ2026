export const DONATION_MIN = 5;
export const DONATION_MAX = 25;
export const DONATION_PRESETS = [5, 10, 15, 20, 25] as const;

export type DonationStatus = "pending" | "paid" | "failed" | "expired";

export type DonationRecord = {
  id: string;
  full_name: string;
  dui: string;
  email: string;
  phone: string;
  parish: string;
  amount: number;
  status: DonationStatus;
  wompi_enlace_id: number | null;
  wompi_transaction_id: string | null;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
};

export type DonationInput = {
  fullName: string;
  dui: string;
  email: string;
  phone: string;
  parish: string;
  amount: number;
};

const DUI_RE = /^\d{8}-\d$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeDui(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 8) return digits;
  return `${digits.slice(0, 8)}-${digits.slice(8)}`;
}

export function parseDonationAmount(value: unknown) {
  const amount = typeof value === "number" ? value : Number(String(value || "").replace(",", "."));
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100) / 100;
}

export function parseDonationInput(body: Record<string, unknown>): DonationInput | { error: string } {
  const fullName = String(body.fullName ?? body.full_name ?? "").trim();
  const dui = normalizeDui(String(body.dui ?? ""));
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const parish = String(body.parish ?? "").trim();
  const amount = parseDonationAmount(body.amount);

  if (fullName.length < 3) {
    return { error: "Escribe tu nombre completo." };
  }
  if (!DUI_RE.test(dui)) {
    return { error: "El DUI debe verse así: 00000000-0." };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "El correo no es válido." };
  }
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 8 || phoneDigits.length > 15) {
    return { error: "El teléfono debe tener al menos 8 dígitos." };
  }
  if (parish.length < 3) {
    return { error: "Indica tu parroquia o vicaría." };
  }
  if (amount == null || amount < DONATION_MIN || amount > DONATION_MAX) {
    return {
      error: `La donación debe ser entre $${DONATION_MIN} y $${DONATION_MAX}.`,
    };
  }

  return { fullName, dui, email, phone, parish, amount };
}

export function donationStatusLabel(status: DonationStatus) {
  if (status === "paid") return "Pagada";
  if (status === "failed") return "Fallida";
  if (status === "expired") return "Vencida";
  return "Pendiente";
}
