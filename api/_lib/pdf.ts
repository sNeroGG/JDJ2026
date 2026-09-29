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

      const navyColor = "#142838";
      const tealColor = "#2D808E";
      const darkColor = "#1E293B";
      const grayColor = "#64748B";
      const borderGray = "#E2E8F0";

      const items =
        order.items && order.items.length > 0
          ? order.items
          : [
              {
                productId: order.productId,
                productTitle: order.productTitle,
                variantId: order.variantId,
                size: order.size,
                color: order.color,
                quantity: order.quantity,
                unitPrice: order.unitPrice,
                total: order.total,
              },
            ];

      const statusLabel =
        order.status === "atendido"
          ? "ATENDIDO"
          : order.status === "cancelado"
            ? "CANCELADO"
            : "NUEVO / PENDIENTE";

      // Encabezado
      doc.fillColor(navyColor).fontSize(18).text("JDJ Jayaque 2026", 40, 40);
      doc.fillColor(tealColor).fontSize(10).text("Comprobante de Pedido · Tienda Oficial", 40, 62);

      // Status Badge & Code (derecha)
      doc.rect(430, 38, 142, 20).fill(navyColor);
      doc.fillColor("#FFFFFF").fontSize(8).text(statusLabel, 430, 44, { align: "center", width: 142 });

      doc.fillColor(grayColor).fontSize(9).text("Código: ", 380, 64, { align: "right" });
      doc.fillColor(navyColor).fontSize(10).text(order.id, 460, 63, { align: "right" });

      doc.y = 85;
      doc.strokeColor(tealColor).lineWidth(2).moveTo(40, doc.y).lineTo(572, doc.y).stroke();
      doc.moveDown(1);

      // Info Grid Box (Gris claro)
      const infoBoxY = doc.y;
      doc.rect(40, infoBoxY, 532, 85).fillAndStroke("#F8FAFC", borderGray);

      // Left Column
      doc.fillColor(darkColor).fontSize(9);
      let leftY = infoBoxY + 10;
      doc.font("Helvetica-Bold").text("Cliente: ", 50, leftY, { continued: true });
      doc.font("Helvetica").text(order.name);

      leftY += 16;
      doc.font("Helvetica-Bold").text("Teléfono / WA: ", 50, leftY, { continued: true });
      doc.font("Helvetica").text(order.phone);

      leftY += 16;
      doc.font("Helvetica-Bold").text("Correo: ", 50, leftY, { continued: true });
      doc.font("Helvetica").text(order.email);

      leftY += 16;
      doc.font("Helvetica-Bold").text("Fecha de registro: ", 50, leftY, { continued: true });
      doc.font("Helvetica").text(formatOrderDate(order.createdAt));

      // Right Column
      let rightY = infoBoxY + 10;
      doc.font("Helvetica-Bold").text("Parroquia / Gp: ", 310, rightY, { continued: true });
      doc.font("Helvetica").text(order.parish || "No especificada");

      if (order.vicariate) {
        rightY += 16;
        doc.font("Helvetica-Bold").text("Vicaría: ", 310, rightY, { continued: true });
        doc.font("Helvetica").text(order.vicariate);
      }

      if (order.municipality || order.department) {
        rightY += 16;
        const loc = [order.municipality, order.department].filter(Boolean).join(", ");
        doc.font("Helvetica-Bold").text("Ubicación: ", 310, rightY, { continued: true });
        doc.font("Helvetica").text(loc);
      }

      rightY += 16;
      doc.font("Helvetica-Bold").text("Método de pago: ", 310, rightY, { continued: true });
      doc.font("Helvetica").text(order.payment || "Transferencia bancaria");

      doc.y = infoBoxY + 95;

      // Note Box if exists
      if (order.note) {
        const noteY = doc.y;
        doc.rect(40, noteY, 532, 28).fillAndStroke("#FFFBE0", "#FEF08A");
        doc.fillColor("#713F12").fontSize(9).font("Helvetica-Bold").text("Nota: ", 50, noteY + 8, { continued: true });
        doc.font("Helvetica").text(order.note);
        doc.y = noteY + 36;
      }

      doc.moveDown(0.5);

      // Group items by product title
      const grouped = new Map<string, typeof items>();
      items.forEach((item) => {
        const title = (item.productTitle || "Producto").trim();
        const list = grouped.get(title) || [];
        list.push(item);
        grouped.set(title, list);
      });

      // Render style cards
      grouped.forEach((styleItems, styleTitle) => {
        const styleY = doc.y;
        const totalStyleQty = styleItems.reduce((sum, i) => sum + i.quantity, 0);

        // Header Bar
        doc.rect(40, styleY, 532, 22).fill(navyColor);
        doc.fillColor("#FFFFFF").fontSize(10).font("Helvetica-Bold").text(styleTitle, 50, styleY + 6);
        doc.fontSize(8).text(`${totalStyleQty} ud.`, 500, styleY + 7, { align: "right" });

        // Table Header
        const thY = styleY + 22;
        doc.rect(40, thY, 532, 18).fill("#F1F5F9");
        doc.fillColor("#475569").fontSize(8).font("Helvetica-Bold");
        doc.text("VARIANTE / COLOR", 50, thY + 5);
        doc.text("TALLA", 280, thY + 5);
        doc.text("CANT.", 360, thY + 5);
        doc.text("P. UNIT", 430, thY + 5);
        doc.text("SUBTOTAL", 495, thY + 5);

        let rowY = thY + 18;
        doc.font("Helvetica").fontSize(9).fillColor(darkColor);

        styleItems.forEach((item) => {
          doc.text(item.color || "Estándar", 50, rowY + 5, { width: 220 });
          doc.text(item.size || "Única", 280, rowY + 5);
          doc.text(String(item.quantity), 360, rowY + 5);
          doc.text(formatUsd(item.unitPrice), 430, rowY + 5);
          doc.text(formatUsd(item.total), 495, rowY + 5);
          rowY += 18;
          doc.strokeColor("#F1F5F9").lineWidth(0.5).moveTo(40, rowY).lineTo(572, rowY).stroke();
        });

        doc.y = rowY + 10;
      });

      // Summary Bar at bottom
      const summaryY = doc.y;
      const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
      doc.rect(40, summaryY, 532, 32).fill(navyColor);
      doc.fillColor("#FFFFFF").fontSize(10).font("Helvetica").text(`Total de prendas: ${totalUnits} ud.`, 50, summaryY + 10);
      doc.fillColor("#5EEAD4").fontSize(13).font("Helvetica-Bold").text(`Monto Total: ${formatUsd(order.total)}`, 350, summaryY + 8, { align: "right", width: 210 });

      // Footer
      doc.y = 700;
      doc.strokeColor(borderGray).lineWidth(1).moveTo(40, 690).lineTo(572, 690).stroke();
      doc
        .fillColor(grayColor)
        .fontSize(8)
        .font("Helvetica")
        .text(
          "Gracias por apoyar a la Jornada Diocesana de la Juventud Jayaque 2026.\nEste comprobante es generado automáticamente por el sistema oficial.",
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
