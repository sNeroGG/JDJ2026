import html2pdf from "html2pdf.js";
import type { StoreOrder } from "../data/defaultContent.js";
import { formatUsd, type OrderReport } from "./store.js";

export function buildOrderPdfHtml(order: StoreOrder, siteName = "JDJ Jayaque 2026"): string {
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

  type GroupedStyle = {
    title: string;
    items: typeof items;
    totalQty: number;
    totalAmount: number;
  };

  const groupedStylesMap = new Map<string, GroupedStyle>();

  for (const item of items) {
    const titleKey = (item.productTitle || "Camisa / Producto").trim();
    let group = groupedStylesMap.get(titleKey);
    if (!group) {
      group = {
        title: titleKey,
        items: [],
        totalQty: 0,
        totalAmount: 0,
      };
      groupedStylesMap.set(titleKey, group);
    }
    group.items.push(item);
    group.totalQty += item.quantity;
    group.totalAmount += item.total;
  }

  const groupedStyles = Array.from(groupedStylesMap.values());
  const grandTotalUnits = groupedStyles.reduce((sum, g) => sum + g.totalQty, 0);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante de Pedido ${order.id} - ${siteName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif; color: #1c232c; line-height: 1.5; padding: 2rem; background: #ffffff; }
    .invoice { max-width: 760px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 2.5rem; border-radius: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); background: #ffffff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2d808e; padding-bottom: 1.5rem; margin-bottom: 1.75rem; }
    .logo { font-size: 1.6rem; font-weight: 800; color: #142838; letter-spacing: -0.02em; }
    .sublogo { color: #2d808e; font-size: 0.9rem; font-weight: 700; margin-top: 0.2rem; }
    .badge { display: inline-block; padding: 0.35rem 0.85rem; border-radius: 999px; background: #142838; color: #ffffff; font-weight: 700; font-size: 0.78rem; letter-spacing: 0.05em; text-transform: uppercase; }
    .code-box { text-align: right; margin-top: 0.5rem; font-size: 0.88rem; color: #64748b; }
    .code-box strong { color: #142838; font-size: 1.05rem; }
    
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.75rem; background: #f8fafc; padding: 1.25rem; border-radius: 10px; border: 1px solid #e2e8f0; }
    .info-block p { margin-bottom: 0.3rem; font-size: 0.92rem; color: #475569; }
    .info-block strong { color: #1e293b; }
    .note-box { background: #fffbe0; border: 1px solid #fef08a; padding: 0.85rem 1rem; border-radius: 8px; font-size: 0.9rem; margin-bottom: 1.75rem; color: #713f12; }
    
    .style-card { border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; margin-bottom: 1.5rem; background: #ffffff; }
    .style-card__header { background: #142838; color: #ffffff; padding: 0.75rem 1.1rem; display: flex; justify-content: space-between; align-items: center; }
    .style-card__title { font-size: 1rem; font-weight: 800; letter-spacing: 0.01em; }
    .style-card__badge { background: #2d808e; color: #ffffff; padding: 0.2rem 0.65rem; border-radius: 999px; font-size: 0.78rem; font-weight: 700; }
    
    table.style-table { width: 100%; border-collapse: collapse; }
    table.style-table th { background: #f1f5f9; color: #475569; text-align: left; padding: 0.6rem 1.1rem; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; }
    table.style-table td { padding: 0.7rem 1.1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: #1e293b; }
    table.style-table tr:last-child td { border-bottom: none; }
    
    .size-badge { display: inline-block; padding: 0.2rem 0.65rem; border-radius: 6px; background: #e2e8f0; color: #0f172a; font-weight: 700; font-size: 0.84rem; }
    
    .style-card__footer { background: #f8fafc; border-top: 1px dashed #cbd5e1; padding: 0.7rem 1.1rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem; color: #475569; }
    .style-card__footer strong { color: #0f172a; font-size: 0.95rem; }

    .invoice-summary { background: #142838; color: #ffffff; border-radius: 10px; padding: 1.25rem 1.5rem; margin-top: 1.75rem; display: flex; justify-content: space-between; align-items: center; }
    .invoice-summary__units { font-size: 0.98rem; opacity: 0.92; }
    .invoice-summary__units strong { color: #ffffff; }
    .invoice-summary__total { font-size: 1.35rem; font-weight: 800; color: #5eead4; }

    .footer-note { margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; font-size: 0.85rem; color: #64748b; text-align: center; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        <h1 class="logo">${siteName}</h1>
        <div class="sublogo">Comprobante de Pedido · Tienda Oficial</div>
      </div>
      <div>
        <span class="badge">${statusLabel}</span>
        <div class="code-box">Código: <strong>${order.id}</strong></div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <p><strong>Cliente:</strong> ${order.name}</p>
        <p><strong>Teléfono / WhatsApp:</strong> ${order.phone}</p>
        <p><strong>Correo electrónico:</strong> ${order.email}</p>
      </div>
      <div class="info-block">
        <p><strong>Parroquia, Movimiento o Asociación:</strong> ${order.parish || "No especificada"}</p>
        ${order.vicariate ? `<p><strong>Vicaría:</strong> ${order.vicariate}</p>` : ""}
        ${order.municipality ? `<p><strong>Municipio:</strong> ${order.municipality}</p>` : ""}
        ${order.department ? `<p><strong>Departamento:</strong> ${order.department}</p>` : ""}
        <p><strong>Fecha de registro:</strong> ${dateStr}</p>
        <p><strong>Método de pago:</strong> ${order.payment}</p>
      </div>
    </div>

    ${
      order.note
        ? `<div class="note-box"><strong>Indicaciones / Nota:</strong> ${order.note}</div>`
        : ""
    }

    <!-- Style Cards Breakdown -->
    ${groupedStyles
      .map(
        (group) => `
    <div class="style-card">
      <div class="style-card__header">
        <h3 class="style-card__title">👕 ${group.title}</h3>
        <span class="style-card__badge">${group.totalQty} ${group.totalQty === 1 ? "unidad" : "unidades"}</span>
      </div>
      <table class="style-table">
        <thead>
          <tr>
            <th>Talla</th>
            <th>Color / Detalles</th>
            <th style="text-align: center;">Cantidad</th>
            <th style="text-align: right;">Precio Unit.</th>
            <th style="text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${group.items
            .map(
              (item) => `
            <tr>
              <td><span class="size-badge">Talla ${item.size || "Única"}</span></td>
              <td>${item.color || "-"}</td>
              <td style="text-align: center;"><strong>x${item.quantity}</strong></td>
              <td style="text-align: right;">${formatUsd(item.unitPrice)}</td>
              <td style="text-align: right;"><strong>${formatUsd(item.total)}</strong></td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      <div class="style-card__footer">
        <span>Total prendas de este estilo: <strong>${group.totalQty} ${group.totalQty === 1 ? "unidad" : "unidades"}</strong></span>
        <span>Subtotal estilo: <strong>${formatUsd(group.totalAmount)}</strong></span>
      </div>
    </div>
    `,
      )
      .join("")}

    <div class="invoice-summary">
      <div class="invoice-summary__units">
        Total prendas del pedido: <strong>${grandTotalUnits} ${grandTotalUnits === 1 ? "unidad" : "unidades"}</strong>
      </div>
      <div class="invoice-summary__total">
        TOTAL A PAGAR: ${formatUsd(order.total)}
      </div>
    </div>

    <div class="footer-note">
      <p>El seguimiento del pedido y los datos de transferencia son coordinados directamente vía WhatsApp.</p>
      <p>¡Muchas gracias por apoyar la Jornada Diocesana de la Juventud Jayaque 2026!</p>
    </div>
  </div>
</body>
</html>`;
}

export function downloadOrderPdf(order: StoreOrder, siteName = "JDJ Jayaque 2026") {
  const html = buildOrderPdfHtml(order, siteName) + `
  <script>
    window.onload = function() {
      window.print();
    };
  </script>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

export async function generateOrderPdfBlob(
  order: StoreOrder,
  siteName = "JDJ Jayaque 2026"
): Promise<Blob> {
  const html = buildOrderPdfHtml(order, siteName);
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = "760px";
  container.style.background = "#ffffff";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const targetElement = container.querySelector(".invoice") || container;
    const worker = (html2pdf as any)()
      .set({
        margin: [10, 10, 10, 10],
        filename: `Pedido_${order.id}.pdf`,
        image: { type: "jpeg", quality: 0.9 },
        html2canvas: { scale: 1.5, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "letter", orientation: "portrait" },
      })
      .from(targetElement);

    const pdfBlob: Blob = await worker.outputPdf("blob");
    return pdfBlob;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

export function downloadReportPdf(
  _report: OrderReport,
  periodLabel: string,
  siteName = "JDJ Jayaque 2026",
) {
  const dateStr = new Date().toLocaleDateString("es-SV", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Resumen General de Pedidos - ${periodLabel} - ${siteName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif; color: #1c232c; line-height: 1.5; padding: 2rem; background: #ffffff; }
    .report { max-width: 820px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 2.5rem; border-radius: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); }
    .header { border-bottom: 2px solid #2d808e; padding-bottom: 1.25rem; margin-bottom: 1.75rem; display: flex; justify-content: space-between; align-items: flex-start; }
    .logo { font-size: 1.6rem; font-weight: 800; color: #142838; letter-spacing: -0.02em; }
    .sublogo { color: #2d808e; font-size: 0.95rem; font-weight: 700; margin-top: 0.2rem; }
  </style>
</head>
<body>
  <div class="report">
    <div class="header">
      <div>
        <h1 class="logo">${siteName}</h1>
        <div class="sublogo">Reporte de Pedidos · ${periodLabel}</div>
      </div>
      <div style="text-align: right; font-size: 0.85rem; color: #64748b;">
        Generado: <strong>${dateStr}</strong>
      </div>
    </div>
  </div>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
