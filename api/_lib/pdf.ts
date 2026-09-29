import PDFDocument from "pdfkit";
import type { StoreOrder } from "../../src/data/defaultContent.js";
import { formatUsd } from "../../src/utils/store.js";

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
      const tealLightColor = "#5EEAD4";
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

      const dateStr = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("es-SV", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Reciente";

      const statusLabel =
        order.status === "atendido"
          ? "ATENDIDO"
          : order.status === "cancelado"
            ? "CANCELADO"
            : "NUEVO / PENDIENTE";

      // Encabezado principal
      doc.fillColor(navyColor).fontSize(18).font("Helvetica-Bold").text("JDJ Jayaque 2026", 40, 40);
      doc.fillColor(tealColor).fontSize(10).font("Helvetica-Bold").text("Comprobante de Pedido · Tienda Oficial", 40, 62);

      // Status Badge & Code Box (Arriba a la derecha)
      doc.rect(430, 36, 142, 22).fill(navyColor);
      doc.fillColor("#FFFFFF").fontSize(8).font("Helvetica-Bold").text(statusLabel, 430, 43, { align: "center", width: 142 });

      doc.fillColor(grayColor).fontSize(9).font("Helvetica").text("Código: ", 360, 64, { align: "right" });
      doc.fillColor(navyColor).fontSize(10).font("Helvetica-Bold").text(order.id, 460, 63, { align: "right" });

      // Línea divisoria superior en color Teal (#2D808E)
      doc.y = 86;
      doc.strokeColor(tealColor).lineWidth(2).moveTo(40, doc.y).lineTo(572, doc.y).stroke();
      doc.moveDown(0.8);

      // Cuadrícula de Información del Solicitante (#F8FAFC)
      const infoBoxY = doc.y;
      doc.rect(40, infoBoxY, 532, 92).fillAndStroke("#F8FAFC", borderGray);

      // Columna Izquierda
      doc.fillColor(darkColor).fontSize(9);
      let leftY = infoBoxY + 10;
      doc.font("Helvetica-Bold").text("Cliente: ", 52, leftY, { continued: true });
      doc.font("Helvetica").text(order.name);

      leftY += 16;
      doc.font("Helvetica-Bold").text("Teléfono / WhatsApp: ", 52, leftY, { continued: true });
      doc.font("Helvetica").text(order.phone);

      leftY += 16;
      doc.font("Helvetica-Bold").text("Correo electrónico: ", 52, leftY, { continued: true });
      doc.font("Helvetica").text(order.email);

      // Columna Derecha
      let rightY = infoBoxY + 10;
      doc.font("Helvetica-Bold").text("Parroquia / Movimiento: ", 300, rightY, { continued: true });
      doc.font("Helvetica").text(order.parish || "No especificada");

      if (order.vicariate) {
        rightY += 14;
        doc.font("Helvetica-Bold").text("Vicaría: ", 300, rightY, { continued: true });
        doc.font("Helvetica").text(order.vicariate);
      }

      if (order.municipality || order.department) {
        rightY += 14;
        const loc = [order.municipality, order.department].filter(Boolean).join(", ");
        doc.font("Helvetica-Bold").text("Ubicación: ", 300, rightY, { continued: true });
        doc.font("Helvetica").text(loc);
      }

      rightY += 14;
      doc.font("Helvetica-Bold").text("Fecha de registro: ", 300, rightY, { continued: true });
      doc.font("Helvetica").text(dateStr);

      rightY += 14;
      doc.font("Helvetica-Bold").text("Método de pago: ", 300, rightY, { continued: true });
      doc.font("Helvetica").text(order.payment || "Transferencia");

      doc.y = infoBoxY + 100;

      // Caja de Notas / Indicaciones si existe
      if (order.note) {
        const noteY = doc.y;
        doc.rect(40, noteY, 532, 28).fillAndStroke("#FFFBE0", "#FEF08A");
        doc.fillColor("#713F12").fontSize(9).font("Helvetica-Bold").text("Indicaciones / Nota: ", 50, noteY + 8, { continued: true });
        doc.font("Helvetica").text(order.note);
        doc.y = noteY + 36;
      }

      doc.moveDown(0.5);

      // Agrupar ítems por estilo / título de producto
      type GroupedStyle = {
        title: string;
        items: typeof items;
        totalQty: number;
        totalAmount: number;
      };

      const groupedMap = new Map<string, GroupedStyle>();

      for (const item of items) {
        const titleKey = (item.productTitle || "Camisa / Producto").trim();
        let group = groupedMap.get(titleKey);
        if (!group) {
          group = { title: titleKey, items: [], totalQty: 0, totalAmount: 0 };
          groupedMap.set(titleKey, group);
        }
        group.items.push(item);
        group.totalQty += item.quantity;
        group.totalAmount += item.total;
      }

      const groupedStyles = Array.from(groupedMap.values());
      const grandTotalUnits = groupedStyles.reduce((sum, g) => sum + g.totalQty, 0);

      // Renderizar tarjetas de estilos (Style Cards)
      groupedStyles.forEach((group) => {
        const styleY = doc.y;

        // Cabecera de la tarjeta del estilo
        doc.rect(40, styleY, 532, 24).fill(navyColor);
        doc.fillColor("#FFFFFF").fontSize(10).font("Helvetica-Bold").text(`Camisa: ${group.title}`, 50, styleY + 6);
        doc.rect(480, styleY + 4, 82, 16).fill(tealColor);
        doc.fillColor("#FFFFFF").fontSize(8).font("Helvetica-Bold").text(`${group.totalQty} ${group.totalQty === 1 ? "unidad" : "unidades"}`, 480, styleY + 7, { align: "center", width: 82 });

        // Encabezado de la tabla de ítems
        const thY = styleY + 24;
        doc.rect(40, thY, 532, 18).fill("#F1F5F9");
        doc.fillColor("#475569").fontSize(8).font("Helvetica-Bold");
        doc.text("TALLA", 50, thY + 5);
        doc.text("COLOR / DETALLES", 160, thY + 5);
        doc.text("CANTIDAD", 320, thY + 5, { align: "center", width: 60 });
        doc.text("PRECIO UNIT.", 400, thY + 5, { align: "right", width: 70 });
        doc.text("SUBTOTAL", 485, thY + 5, { align: "right", width: 77 });

        let rowY = thY + 18;
        doc.font("Helvetica").fontSize(9).fillColor(darkColor);

        group.items.forEach((item) => {
          doc.rect(50, rowY + 3, 70, 14).fillAndStroke("#E2E8F0", "#CBD5E1");
          doc.fillColor("#0F172A").fontSize(8).font("Helvetica-Bold").text(`Talla ${item.size || "Única"}`, 50, rowY + 5, { align: "center", width: 70 });

          doc.fillColor(darkColor).fontSize(9).font("Helvetica").text(item.color || "-", 160, rowY + 5);
          doc.font("Helvetica-Bold").text(`x${item.quantity}`, 320, rowY + 5, { align: "center", width: 60 });
          doc.font("Helvetica").text(formatUsd(item.unitPrice), 400, rowY + 5, { align: "right", width: 70 });
          doc.font("Helvetica-Bold").text(formatUsd(item.total), 485, rowY + 5, { align: "right", width: 77 });

          rowY += 20;
          doc.strokeColor("#F1F5F9").lineWidth(0.5).moveTo(40, rowY).lineTo(572, rowY).stroke();
        });

        // Pie de la tarjeta de estilo (Style Footer)
        const sfY = rowY + 2;
        doc.rect(40, sfY, 532, 20).fill("#F8FAFC");
        doc.fillColor(grayColor).fontSize(8).font("Helvetica").text(`Total prendas de este estilo: `, 50, sfY + 5, { continued: true });
        doc.font("Helvetica-Bold").fillColor(darkColor).text(`${group.totalQty} ${group.totalQty === 1 ? "unidad" : "unidades"}`);

        doc.fillColor(grayColor).fontSize(8).font("Helvetica").text(`Subtotal estilo: `, 380, sfY + 5, { continued: true, align: "right" });
        doc.font("Helvetica-Bold").fillColor(darkColor).fontSize(9).text(formatUsd(group.totalAmount));

        doc.y = sfY + 28;
      });

      // Barra de Resumen del Pedido (Invoice Summary Bar)
      const summaryY = doc.y;
      doc.rect(40, summaryY, 532, 34).fill(navyColor);
      doc.fillColor("#FFFFFF").fontSize(10).font("Helvetica").text(`Total prendas del pedido: `, 52, summaryY + 11, { continued: true });
      doc.font("Helvetica-Bold").text(`${grandTotalUnits} ${grandTotalUnits === 1 ? "unidad" : "unidades"}`);

      doc.fillColor(tealLightColor).fontSize(12).font("Helvetica-Bold").text(`TOTAL A PAGAR: ${formatUsd(order.total)}`, 320, summaryY + 10, { align: "right", width: 240 });

      // Pie de Página Institucional (Footer Note)
      doc.y = 700;
      doc.strokeColor(borderGray).lineWidth(1).moveTo(40, 690).lineTo(572, 690).stroke();
      doc
        .fillColor(grayColor)
        .fontSize(8)
        .font("Helvetica")
        .text(
          "El seguimiento del pedido y los datos de transferencia son coordinados directamente vía WhatsApp.\n¡Muchas gracias por apoyar la Jornada Diocesana de la Juventud Jayaque 2026!",
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
      const dateStr = donation.createdAt
        ? new Date(donation.createdAt).toLocaleDateString("es-SV", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : new Date().toLocaleDateString("es-SV", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
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
