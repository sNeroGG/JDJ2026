import PDFDocument from "pdfkit";
import type { StoreOrder } from "../../src/data/defaultContent.js";
import { formatOrderDate, formatUsd } from "../../src/utils/store.js";

export function generateOrderPdfBuffer(order: StoreOrder): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "LETTER" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const primaryColor = "#C0392B"; // Rojo JDJ
      const darkColor = "#1F2937";
      const grayColor = "#4B5563";

      // Encabezado
      doc.fillColor(primaryColor).fontSize(18).text("JDJ JAYAQUE 2026", 40, 40);
      doc.fillColor(darkColor).fontSize(10).text("Arquidiócesis de San Salvador", 40, 62);

      doc.fillColor(primaryColor).fontSize(14).text(`Comprobante de Pedido`, 350, 40, { align: "right" });
      doc.fillColor(grayColor).fontSize(9).text(`Código: ${order.id}`, 350, 58, { align: "right" });
      doc.text(`Fecha: ${formatOrderDate(order.createdAt)}`, 350, 70, { align: "right" });

      doc.y = 95;
      doc.strokeColor("#E5E7EB").lineWidth(1).moveTo(40, doc.y).lineTo(572, doc.y).stroke();
      doc.moveDown(1.5);

      // Datos del Cliente
      doc.fillColor(primaryColor).fontSize(12).text("Datos del Solicitante");
      doc.moveDown(0.3);
      doc.fillColor(darkColor).fontSize(10);
      doc.text(`Nombre: ${order.name}`);
      doc.text(`Teléfono: ${order.phone}`);
      doc.text(`Correo: ${order.email}`);
      doc.text(`Parroquia / Movimiento: ${order.parish || "N/A"}`);
      if (order.vicariate) doc.text(`Vicaría: ${order.vicariate}`);
      if (order.municipality || order.department) {
        doc.text(`Ubicación: ${[order.municipality, order.department].filter(Boolean).join(", ")}`);
      }

      doc.moveDown(1.5);

      // Tabla de Productos
      doc.fillColor(primaryColor).fontSize(12).text("Detalle del Pedido");
      doc.moveDown(0.5);

      const items =
        order.items && order.items.length > 0
          ? order.items
          : [
              {
                productTitle: order.productTitle,
                size: order.size,
                color: order.color,
                quantity: order.quantity,
                unitPrice: order.unitPrice,
                total: order.total,
              },
            ];

      const startY = doc.y;
      doc.rect(40, startY, 532, 20).fill("#F3F4F6");
      doc.fillColor(darkColor).fontSize(9);
      doc.text("Producto / Variante", 50, startY + 6);
      doc.text("Cant.", 350, startY + 6);
      doc.text("P. Unit", 420, startY + 6);
      doc.text("Subtotal", 490, startY + 6);

      let currentY = startY + 26;
      items.forEach((item) => {
        const variantStr =
          [item.color, item.size].filter(Boolean).join(" / ") || "Única";
        doc
          .fillColor(darkColor)
          .fontSize(9)
          .text(`${item.productTitle} (${variantStr})`, 50, currentY, { width: 280 });
        doc.text(String(item.quantity), 350, currentY);
        doc.text(formatUsd(item.unitPrice), 420, currentY);
        doc.text(formatUsd(item.total), 490, currentY);
        currentY += 20;
      });

      doc.y = currentY + 10;
      doc.strokeColor("#E5E7EB").lineWidth(1).moveTo(40, doc.y).lineTo(572, doc.y).stroke();
      doc.moveDown(1);

      // Total y Pago
      doc
        .fillColor(primaryColor)
        .fontSize(14)
        .text(`Total a Pagar: ${formatUsd(order.total)}`, { align: "right" });
      doc
        .fillColor(grayColor)
        .fontSize(9)
        .text(`Método de Pago: ${order.payment || "Transferencia bancaria"}`, { align: "right" });

      if (order.note) {
        doc.moveDown(1);
        doc.fillColor(darkColor).fontSize(10).text(`Nota del cliente: ${order.note}`);
      }

      // Pie de página
      doc.y = 700;
      doc
        .fillColor(grayColor)
        .fontSize(8)
        .text(
          "Gracias por apoyar la Jornada Diocesana de la Juventud Jayaque 2026.\nEste comprobante es generado automáticamente por el sistema oficial.",
          40,
          700,
          { align: "center", width: 532 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function generateDonationPdfBuffer(donation: {
  id: string;
  fullName: string;
  dui?: string;
  email: string;
  phone: string;
  parish: string;
  amount: number;
  createdAt?: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "LETTER" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const primaryColor = "#C0392B"; // Rojo JDJ
      const darkColor = "#1F2937";
      const grayColor = "#4B5563";

      // Encabezado
      doc.fillColor(primaryColor).fontSize(18).text("JDJ JAYAQUE 2026", 40, 40);
      doc.fillColor(darkColor).fontSize(10).text("Arquidiócesis de San Salvador", 40, 62);

      doc.fillColor(primaryColor).fontSize(14).text(`Comprobante de Donación`, 350, 40, { align: "right" });
      doc.fillColor(grayColor).fontSize(9).text(`Referencia: ${donation.id}`, 350, 58, { align: "right" });
      const dateStr = donation.createdAt ? formatOrderDate(donation.createdAt) : formatOrderDate(new Date().toISOString());
      doc.text(`Fecha: ${dateStr}`, 350, 70, { align: "right" });

      doc.y = 95;
      doc.strokeColor("#E5E7EB").lineWidth(1).moveTo(40, doc.y).lineTo(572, doc.y).stroke();
      doc.moveDown(1.5);

      // Datos del Donante
      doc.fillColor(primaryColor).fontSize(12).text("Datos del Donante");
      doc.moveDown(0.3);
      doc.fillColor(darkColor).fontSize(10);
      doc.text(`Nombre completo: ${donation.fullName}`);
      if (donation.dui) doc.text(`DUI: ${donation.dui}`);
      doc.text(`Teléfono: ${donation.phone}`);
      doc.text(`Correo: ${donation.email}`);
      doc.text(`Parroquia / Vicaría / Movimiento: ${donation.parish || "N/A"}`);

      doc.moveDown(1.5);

      // Detalle de la Donación
      doc.fillColor(primaryColor).fontSize(12).text("Detalle del Aporte");
      doc.moveDown(0.5);

      const startY = doc.y;
      doc.rect(40, startY, 532, 20).fill("#F3F4F6");
      doc.fillColor(darkColor).fontSize(9);
      doc.text("Concepto", 50, startY + 6);
      doc.text("Monto", 490, startY + 6);

      const currentY = startY + 26;
      doc.fillColor(darkColor).fontSize(10).text("Donación para la organización de la JDJ Jayaque 2026", 50, currentY);
      doc.text(formatUsd(donation.amount), 490, currentY);

      doc.y = currentY + 20;
      doc.strokeColor("#E5E7EB").lineWidth(1).moveTo(40, doc.y).lineTo(572, doc.y).stroke();
      doc.moveDown(1);

      doc
        .fillColor(primaryColor)
        .fontSize(14)
        .text(`Monto Total: ${formatUsd(donation.amount)}`, { align: "right" });
      doc
        .fillColor(grayColor)
        .fontSize(9)
        .text("Método de Pago: Transferencia bancaria", { align: "right" });

      // Pie de página
      doc.y = 700;
      doc
        .fillColor(grayColor)
        .fontSize(8)
        .text(
          "¡Muchas gracias por tu generosidad y apoyo a la juventud de nuestra Arquidiócesis!\nEste comprobante es generado automáticamente por el sistema oficial de la JDJ 2026.",
          40,
          700,
          { align: "center", width: 532 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
