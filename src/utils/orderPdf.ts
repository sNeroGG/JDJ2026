import type { StoreOrder } from "../data/defaultContent";
import { formatUsd, type OrderReport } from "./store";

export function downloadOrderPdf(order: StoreOrder, siteName = "JDJ Jayaque 2026") {
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

  // Group items by product title/style
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

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante de Pedido ${order.id} - ${siteName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif; color: #1c232c; line-height: 1.5; padding: 2rem; background: #ffffff; }
    .invoice { max-width: 760px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 2.5rem; border-radius: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); }
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
    
    @media print {
      body { padding: 0; }
      .invoice { border: none; padding: 0; box-shadow: none; }
      @page { margin: 1.5cm; }
    }
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
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

export function downloadReportPdf(
  report: OrderReport,
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
    .period-badge { background: #2d808e; color: #ffffff; padding: 0.4rem 1rem; border-radius: 999px; font-weight: 700; font-size: 0.9rem; text-align: right; }
    .meta-bar { font-size: 0.85rem; color: #64748b; margin-top: 0.4rem; text-align: right; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; text-align: center; }
    .kpi-card p { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: #64748b; margin-bottom: 0.2rem; }
    .kpi-card strong { font-size: 1.4rem; font-weight: 800; color: #142838; display: block; }
    .kpi-card span { font-size: 0.75rem; color: #64748b; }
    section { margin-bottom: 2rem; }
    h2 { font-size: 1.15rem; color: #142838; margin-bottom: 1rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.4rem; font-weight: 800; }
    
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

    .sizes-grid { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-bottom: 1.5rem; }
    .size-pill { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 0.85rem; min-width: 80px; text-align: center; }
    .size-pill strong { display: block; font-size: 1rem; color: #142838; }
    .size-pill span { font-size: 0.78rem; color: #64748b; }
    .footer-note { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; font-size: 0.8rem; color: #64748b; text-align: center; }
    
    @media print {
      body { padding: 0; }
      .report { border: none; padding: 0; box-shadow: none; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <div class="report">
    <div class="header">
      <div>
        <h1 class="logo">${siteName}</h1>
        <div class="sublogo">Informe · Resumen General de Pedidos</div>
      </div>
      <div>
        <div class="period-badge">Período: ${periodLabel}</div>
        <div class="meta-bar">Generado: ${dateStr}</div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <p>Total Pedidos</p>
        <strong>${report.total}</strong>
        <span>${report.byStatus.nuevo} nuevos · ${report.byStatus.atendido} atendidos</span>
      </div>
      <div class="kpi-card">
        <p>Unidades Vendidas</p>
        <strong>${report.units}</strong>
        <span>Sin cancelados</span>
      </div>
      <div class="kpi-card">
        <p>Total Recaudado</p>
        <strong>${formatUsd(report.revenue)}</strong>
        <span>Transferencias</span>
      </div>
      <div class="kpi-card">
        <p>Estilos con Venta</p>
        <strong>${report.productCount} / ${report.products.length}</strong>
        <span>Catálogo tienda</span>
      </div>
    </div>

    ${
      report.sizes.length
        ? `
    <section>
      <h2>Resumen Acumulado por Talla (Todas las prendas)</h2>
      <div class="sizes-grid">
        ${report.sizes
          .map(
            (s) => `
          <div class="size-pill">
            <strong>Talla ${s.size}</strong>
            <span>${s.sold} ${s.sold === 1 ? "vendida" : "vendidas"}</span>
          </div>
        `,
          )
          .join("")}
      </div>
    </section>
    `
        : ""
    }

    ${
      report.products.length
        ? `
    <section>
      <h2>Detalle por Estilo y Desglose de Tallas</h2>
      ${report.products
        .map(
          (p) => `
      <div class="style-card">
        <div class="style-card__header">
          <h3 class="style-card__title">👕 ${p.productTitle}</h3>
          <span class="style-card__badge">${p.sold} ${p.sold === 1 ? "unidad vendida" : "unidades vendidas"}</span>
        </div>
        <table class="style-table">
          <thead>
            <tr>
              <th>Talla / Variación</th>
              <th style="text-align: center;">Pedidos</th>
              <th style="text-align: center;">Unidades Vendidas</th>
              <th style="text-align: right;">Ingreso Total</th>
            </tr>
          </thead>
          <tbody>
            ${p.lines
              .map(
                (line) => `
              <tr>
                <td><span class="size-badge">Talla ${line.size || "Única"}</span> ${line.color ? `(${line.color})` : ""}</td>
                <td style="text-align: center;">${line.orders}</td>
                <td style="text-align: center;"><strong>x${line.sold}</strong></td>
                <td style="text-align: right;">${formatUsd(line.revenue)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        <div class="style-card__footer">
          <span>Total vendidas de este estilo: <strong>${p.sold} ${p.sold === 1 ? "prenda" : "prendas"}</strong></span>
          <span>Ingreso total del estilo: <strong>${formatUsd(p.revenue)}</strong></span>
        </div>
      </div>
      `,
        )
        .join("")}
    </section>
    `
        : ""
    }

    <div class="footer-note">
      <p>JDJ Jayaque 2026 · Panel de Administración de Tienda</p>
    </div>
  </div>
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
