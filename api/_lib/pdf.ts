import PDFDocument from "pdfkit";
import type { StoreOrder } from "../../src/data/defaultContent.js";
import { formatUsd } from "../../src/utils/store.js";

const PAGE_WIDTH = 612;
const LEFT = 44;
const RIGHT = 568;
const CONTENT_WIDTH = RIGHT - LEFT;
const CONTENT_BOTTOM = 730;
const NAVY = "#142838";
const TEAL = "#2D808E";
const DARK = "#1E293B";
const MUTED = "#64748B";
const BORDER = "#DCE4EA";

function createPdf() {
  const doc = new PDFDocument({ size: "LETTER", margins: { top: 42, bottom: 62, left: LEFT, right: PAGE_WIDTH - RIGHT }, bufferPages: true });
  const chunks: Buffer[] = [];
  const result = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  return { doc, result };
}

function addHeader(doc: PDFKit.PDFDocument, title: string, referenceLabel: string, reference: string, accent = TEAL) {
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(20).text("JDJ Jayaque 2026", LEFT, 42, { width: 300 });
  doc.fillColor(accent).font("Helvetica-Bold").fontSize(10).text(title, LEFT, 68, { width: 320 });
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(9).text(referenceLabel.toUpperCase(), 365, 44, { width: 203, align: "right" });
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11).text(reference, 365, 59, { width: 203, align: "right" });
  doc.moveTo(LEFT, 91).lineTo(RIGHT, 91).lineWidth(2).strokeColor(accent).stroke();
  doc.y = 106;
}

function sectionHeading(doc: PDFKit.PDFDocument, title: string, accent = TEAL) {
  ensureSpace(doc, 34);
  doc.fillColor(accent).font("Helvetica-Bold").fontSize(12).text(title, LEFT, doc.y, { width: CONTENT_WIDTH });
  doc.y += 21;
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  if (doc.y + height > CONTENT_BOTTOM) {
    doc.addPage();
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11).text("JDJ Jayaque 2026", LEFT, 38);
    doc.fillColor(MUTED).font("Helvetica").fontSize(9).text("Comprobante · Continuación", LEFT, 54);
    doc.moveTo(LEFT, 72).lineTo(RIGHT, 72).lineWidth(1).strokeColor(BORDER).stroke();
    doc.y = 86;
  }
}

function addInfoRow(doc: PDFKit.PDFDocument, label: string, value: unknown, width = CONTENT_WIDTH) {
  const x = LEFT;
  const labelWidth = 152;
  const text = String(value ?? "—").trim() || "—";
  doc.font("Helvetica-Bold").fontSize(9);
  const labelHeight = doc.heightOfString(label, { width: labelWidth });
  doc.font("Helvetica").fontSize(10);
  const valueHeight = doc.heightOfString(text, { width: width - labelWidth - 10, lineGap: 2 });
  const height = Math.max(labelHeight, valueHeight, 14) + 7;
  ensureSpace(doc, height + 4);
  const rowY = doc.y;
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(9).text(label, x, rowY, { width: labelWidth });
  doc.fillColor(DARK).font("Helvetica").fontSize(10).text(text, x + labelWidth + 10, rowY, { width: width - labelWidth - 10, lineGap: 2 });
  doc.y = rowY + height;
}

function addFooter(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    doc.moveTo(LEFT, 748).lineTo(RIGHT, 748).lineWidth(0.7).strokeColor(BORDER).stroke();
    doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(
      `JDJ Jayaque 2026 · Página ${i + 1} de ${range.count}`,
      LEFT,
      758,
      { width: CONTENT_WIDTH, align: "center" },
    );
  }
}

function finish(doc: PDFKit.PDFDocument, result: Promise<Buffer>) {
  addFooter(doc);
  doc.end();
  return result;
}

function formatDate(value?: string) {
  if (!value) return "Reciente";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Reciente";
  return new Intl.DateTimeFormat("es-SV", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

export function generateOrderPdfBuffer(order: StoreOrder): Promise<Buffer> {
  const { doc, result } = createPdf();
  addHeader(doc, "Comprobante de pedido · Tienda oficial", "Código de pedido", order.id);

  doc.roundedRect(LEFT, doc.y, CONTENT_WIDTH, 7, 3).fill("#F1F5F9");
  doc.y += 16;
  sectionHeading(doc, "Datos del cliente");
  addInfoRow(doc, "Cliente", order.name);
  addInfoRow(doc, "Teléfono / WhatsApp", order.phone);
  addInfoRow(doc, "Correo electrónico", order.email);
  addInfoRow(doc, "Parroquia / movimiento", order.parish || "No especificada");
  if (order.vicariate) addInfoRow(doc, "Vicaría", order.vicariate);
  if (order.municipality) addInfoRow(doc, "Municipio", order.municipality);
  if (order.department) addInfoRow(doc, "Departamento", order.department);
  addInfoRow(doc, "Fecha de registro", formatDate(order.createdAt));
  addInfoRow(doc, "Estado", order.status === "atendido" ? "Atendido" : order.status === "cancelado" ? "Cancelado" : "Nuevo / pendiente");
  addInfoRow(doc, "Método de pago", order.payment || "Transferencia bancaria");
  if (order.note) addInfoRow(doc, "Indicaciones / nota", order.note);

  const items = order.items?.length ? order.items : [{
    productTitle: order.productTitle, size: order.size, color: order.color,
    quantity: order.quantity, unitPrice: order.unitPrice, total: order.total,
  }];
  sectionHeading(doc, "Detalle del pedido");
  let totalUnits = 0;
  for (const item of items) {
    const title = String(item.productTitle || "Producto");
    const detail = [`Talla ${item.size || "Única"}`, item.color || "Sin detalle", `Cantidad: ${item.quantity}`].join("  ·  ");
    doc.font("Helvetica-Bold").fontSize(10);
    const titleHeight = doc.heightOfString(title, { width: CONTENT_WIDTH - 16 });
    doc.font("Helvetica").fontSize(9);
    const detailHeight = doc.heightOfString(detail, { width: CONTENT_WIDTH - 16 });
    const rowHeight = titleHeight + detailHeight + 30;
    ensureSpace(doc, rowHeight + 8);
    const y = doc.y;
    doc.roundedRect(LEFT, y, CONTENT_WIDTH, rowHeight, 6).fillAndStroke("#FFFFFF", BORDER);
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(10).text(title, LEFT + 10, y + 8, { width: CONTENT_WIDTH - 20 });
    doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(detail, LEFT + 10, y + 10 + titleHeight, { width: CONTENT_WIDTH - 20 });
    const totalsY = y + 14 + titleHeight + detailHeight;
    doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(`Unitario: ${formatUsd(item.unitPrice)}`, LEFT + 10, totalsY);
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(9).text(`Subtotal: ${formatUsd(item.total)}`, LEFT + 270, totalsY, { width: CONTENT_WIDTH - 280, align: "right" });
    doc.y = y + rowHeight + 8;
    totalUnits += Number(item.quantity || 0);
  }
  ensureSpace(doc, 52);
  doc.roundedRect(LEFT, doc.y, CONTENT_WIDTH, 42, 6).fill(NAVY);
  doc.fillColor("#FFFFFF").font("Helvetica").fontSize(10).text(`Total de prendas: ${totalUnits}`, LEFT + 12, doc.y + 14);
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(13).text(`TOTAL: ${formatUsd(order.total)}`, LEFT + 230, doc.y + 12, { width: CONTENT_WIDTH - 242, align: "right" });
  doc.y += 54;
  return finish(doc, result);
}

export function generateDonationPdfBuffer(donation: {
  id: string; fullName: string; dui?: string; email: string; phone: string;
  parish: string; amount: number; createdAt?: string;
}): Promise<Buffer> {
  const { doc, result } = createPdf();
  addHeader(doc, "Comprobante oficial de donación", "Referencia", donation.id, "#C0392B");
  sectionHeading(doc, "Datos del donante", "#C0392B");
  addInfoRow(doc, "Nombre completo", donation.fullName);
  if (donation.dui) addInfoRow(doc, "DUI", donation.dui);
  addInfoRow(doc, "Teléfono / WhatsApp", donation.phone);
  addInfoRow(doc, "Correo electrónico", donation.email);
  addInfoRow(doc, "Parroquia / vicaría / movimiento", donation.parish || "General");
  addInfoRow(doc, "Fecha de registro", formatDate(donation.createdAt));
  sectionHeading(doc, "Aporte", "#C0392B");
  ensureSpace(doc, 76);
  doc.roundedRect(LEFT, doc.y, CONTENT_WIDTH, 62, 8).fillAndStroke("#FFF7F5", "#F3C7C1");
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(9).text("MONTO DONADO", LEFT + 14, doc.y + 12);
  doc.fillColor("#A93226").font("Helvetica-Bold").fontSize(20).text(`${formatUsd(donation.amount)} USD`, LEFT + 14, doc.y + 28, { width: CONTENT_WIDTH - 28 });
  doc.y += 78;
  doc.fillColor(MUTED).font("Helvetica").fontSize(9).text("Método de pago: Transferencia bancaria", LEFT, doc.y, { width: CONTENT_WIDTH, align: "right" });
  doc.y += 24;
  doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(
    "¡Gracias por apoyar a la juventud de nuestra Arquidiócesis y hacer posible la Jornada Diocesana de la Juventud Jayaque 2026!",
    LEFT, doc.y, { width: CONTENT_WIDTH, align: "center", lineGap: 3 },
  );
  return finish(doc, result);
}
