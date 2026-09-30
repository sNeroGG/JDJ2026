import type { StoreOrder } from "../../src/data/defaultContent.js";
import type { DonationInput } from "../../src/utils/donations.js";
import { formatUsd } from "../../src/utils/store.js";
import { generateDonationPdfBuffer, generateOrderPdfBuffer } from "./pdf.js";

function escapeHtml(text: string) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildTelegramOrderSummary(order: StoreOrder): string {
  const lines: string[] = [
    `🛍️ <b>¡NUEVO PEDIDO RECIBIDO!</b>`,
    ``,
    `📌 <b>Código:</b> <code>${escapeHtml(order.id)}</code>`,
    `👤 <b>Cliente:</b> ${escapeHtml(order.name)}`,
    `📞 <b>Teléfono:</b> <a href="https://wa.me/${escapeHtml(order.phone)}">${escapeHtml(order.phone)}</a>`,
    `📧 <b>Correo:</b> ${escapeHtml(order.email)}`,
    `⛪ <b>Parroquia / Movimiento:</b> ${escapeHtml(order.parish || "N/A")}`,
  ];

  if (order.vicariate) lines.push(`📍 <b>Vicaría:</b> ${escapeHtml(order.vicariate)}`);
  if (order.municipality || order.department) {
    const loc = [order.municipality, order.department].filter(Boolean).join(", ");
    lines.push(`🏙️ <b>Ubicación:</b> ${escapeHtml(loc)}`);
  }

  lines.push(``);
  lines.push(`📦 <b>Detalle de Prendas:</b>`);

  const items =
    order.items && order.items.length > 0
      ? order.items
      : [
          {
            productTitle: order.productTitle,
            size: order.size,
            color: order.color,
            quantity: order.quantity,
            total: order.total,
          },
        ];

  items.forEach((item) => {
    const variant = [item.color, item.size].filter(Boolean).join(" · ") || "Única";
    lines.push(
      `  • <b>${item.quantity}x</b> ${escapeHtml(item.productTitle)} (${escapeHtml(variant)}) - ${formatUsd(item.total)}`
    );
  });

  lines.push(``);
  lines.push(`💰 <b>TOTAL: ${formatUsd(order.total)} USD</b>`);
  lines.push(`💳 <b>Pago:</b> ${escapeHtml(order.payment || "Transferencia bancaria")}`);

  if (order.note) {
    lines.push(`📝 <b>Nota del cliente:</b> ${escapeHtml(order.note)}`);
  }

  lines.push(``);
  lines.push(`📄 <i>Se adjunta el comprobante oficial en PDF.</i>`);

  return lines.join("\n");
}

export function buildTelegramDonationSummary(
  donation: DonationInput & { id: string }
): string {
  const lines: string[] = [
    `❤️ <b>¡NUEVA DONACIÓN REGISTRADA!</b>`,
    ``,
    `📌 <b>Referencia:</b> <code>${escapeHtml(donation.id)}</code>`,
    `👤 <b>Donante:</b> ${escapeHtml(donation.fullName)}`,
    `📞 <b>Teléfono:</b> <a href="https://wa.me/${escapeHtml(donation.phone)}">${escapeHtml(donation.phone)}</a>`,
    `📧 <b>Correo:</b> ${escapeHtml(donation.email)}`,
    `⛪ <b>Parroquia / Vicaría:</b> ${escapeHtml(donation.parish || "N/A")}`,
    ``,
    `💵 <b>Monto Donado: ${formatUsd(donation.amount)} USD</b>`,
    `💳 <b>Pago:</b> Transferencia bancaria`,
    ``,
    `📄 <i>Se adjunta el comprobante oficial en PDF.</i>`,
  ];

  return lines.join("\n");
}

export async function sendTelegramOrderNotification(
  order: StoreOrder
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[Telegram Bot] TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados.");
    return false;
  }

  try {
    const pdfBuffer = await generateOrderPdfBuffer(order);
    const caption = buildTelegramOrderSummary(order);

    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("caption", caption);
    formData.append("parse_mode", "HTML");

    const pdfUint8Array = new Uint8Array(pdfBuffer);
    const blob = new Blob([pdfUint8Array], { type: "application/pdf" });
    formData.append("document", blob, `Pedido_${order.id}.pdf`);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: "POST",
      body: formData,
    });

    const result = (await res.json()) as { ok?: boolean; description?: string };
    if (!result.ok) {
      console.error("[Telegram Bot Error] Error enviando pedido a Telegram:", result.description || result);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Telegram Bot Exception] Fallo al enviar notificación de pedido:", error);
    return false;
  }
}

export async function sendTelegramDonationNotification(
  donation: DonationInput & { id: string; createdAt?: string }
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[Telegram Bot] TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados.");
    return false;
  }

  try {
    const pdfBuffer = await generateDonationPdfBuffer(donation);
    const caption = buildTelegramDonationSummary(donation);

    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("caption", caption);
    formData.append("parse_mode", "HTML");

    const pdfUint8Array = new Uint8Array(pdfBuffer);
    const blob = new Blob([pdfUint8Array], { type: "application/pdf" });
    formData.append("document", blob, `Donacion_${donation.id}.pdf`);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: "POST",
      body: formData,
    });

    const result = (await res.json()) as { ok?: boolean; description?: string };
    if (!result.ok) {
      console.error("[Telegram Bot Error] Error enviando donación a Telegram:", result.description || result);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Telegram Bot Exception] Fallo al enviar notificación de donación:", error);
    return false;
  }
}
