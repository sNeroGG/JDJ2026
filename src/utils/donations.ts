import { formatUsd, normalizeWhatsapp } from "./store";

export const DONATION_MIN = 5;
export const DONATION_MAX = 25;
export const DONATION_PRESETS = [5, 10, 15, 20, 25] as const;
export const DONATION_PAYMENT = "Transferencia";

export function isDonationPreset(amount: number) {
  return (DONATION_PRESETS as readonly number[]).includes(amount);
}

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DONATION_STATUSES: readonly DonationStatus[] = [
  "pending",
  "paid",
  "failed",
  "expired",
];

export function isDonationStatus(value: string): value is DonationStatus {
  return (DONATION_STATUSES as readonly string[]).includes(value);
}

export function parseDonationAmount(value: unknown) {
  const amount = typeof value === "number" ? value : Number(String(value || "").replace(",", "."));
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100) / 100;
}

export function parseDonationInput(body: Record<string, unknown>): DonationInput | { error: string } {
  const fullName = String(body.fullName ?? body.full_name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const parish = String(body.parish ?? "").trim();
  const amount = parseDonationAmount(body.amount);

  if (fullName.length < 3) {
    return { error: "Escribe tu nombre completo." };
  }
  if (fullName.length > 120 || parish.length > 120) {
    return { error: "Hay un dato demasiado largo." };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "El correo no es válido." };
  }
  if (parish.length < 3) {
    return { error: "Indica tu parroquia o vicaría." };
  }
  if (amount == null || amount < DONATION_MIN || amount > DONATION_MAX) {
    return {
      error: `La donación debe ser entre $${DONATION_MIN} y $${DONATION_MAX}.`,
    };
  }

  return { fullName, dui: "", email, phone: "", parish, amount };
}

export function donationStatusLabel(status: DonationStatus) {
  if (status === "paid") return "Pagada";
  if (status === "failed") return "Fallida";
  if (status === "expired") return "Vencida";
  return "Pendiente";
}

export function buildDonationMessage(input: {
  id: string;
  fullName: string;
  dui: string;
  email: string;
  phone: string;
  parish: string;
  amount: number;
}) {
  return [
    `Hola, quiero hacer una donación a la JDJ Jayaque 2026.`,
    "",
    `Referencia: ${input.id}`,
    `Nombre: ${input.fullName}`,
    `Correo: ${input.email}`,
    `Parroquia / Vicaría / Movimiento: ${input.parish}`,
    `Monto: ${formatUsd(input.amount)}`,
    `Pago: Transferencia bancaria`,
    "",
    `Por favor, envíenme los datos bancarios para completar el aporte.`,
  ].join("\n");
}

export function whatsappDonationUrl(
  whatsapp: string,
  input: Parameters<typeof buildDonationMessage>[0],
) {
  const phone = normalizeWhatsapp(whatsapp);
  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildDonationMessage(input))}`;
}

export function whatsappDonationFollowupUrl(whatsapp: string, id: string) {
  const phone = normalizeWhatsapp(whatsapp);
  if (!phone) return "";
  const text = [
    `Hola, quiero completar mi donación a la JDJ Jayaque 2026.`,
    `Referencia: ${id}`,
    `Pago: Transferencia bancaria`,
  ].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
