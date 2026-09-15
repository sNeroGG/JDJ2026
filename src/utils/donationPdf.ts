import type { DonationRecord } from "./donations.js";
import { donationStatusLabel } from "./donations.js";
import { formatOrderDate, formatUsd } from "./store.js";

export function downloadDonationReceiptPdf(
  donation: DonationRecord,
  siteName = "JDJ Jayaque 2026",
) {
  const dateStr = donation.created_at
    ? formatOrderDate(donation.created_at)
    : "Reciente";

  const statusLabel = donationStatusLabel(donation.status).toUpperCase();

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante de Donación ${donation.id} - ${siteName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif; color: #1c232c; line-height: 1.5; padding: 2rem; background: #ffffff; }
    .invoice { max-width: 720px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 2.5rem; border-radius: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2d808e; padding-bottom: 1.5rem; margin-bottom: 1.75rem; }
    .logo { font-size: 1.6rem; font-weight: 800; color: #142838; letter-spacing: -0.02em; }
    .sublogo { color: #2d808e; font-size: 0.9rem; font-weight: 700; margin-top: 0.2rem; }
    .badge { display: inline-block; padding: 0.35rem 0.85rem; border-radius: 999px; background: ${donation.status === "paid" ? "#059669" : "#142838"}; color: #ffffff; font-weight: 700; font-size: 0.78rem; letter-spacing: 0.05em; text-transform: uppercase; }
    .code-box { text-align: right; margin-top: 0.5rem; font-size: 0.88rem; color: #64748b; }
    .code-box strong { color: #142838; font-size: 1.05rem; }
    
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.75rem; background: #f8fafc; padding: 1.25rem; border-radius: 10px; border: 1px solid #e2e8f0; }
    .info-block p { margin-bottom: 0.4rem; font-size: 0.92rem; color: #475569; }
    .info-block strong { color: #1e293b; }

    .amount-box { background: #f0fdf4; border: 2px dashed #16a34a; padding: 1.5rem; border-radius: 12px; text-align: center; margin-bottom: 2rem; }
    .amount-box p { font-size: 0.88rem; color: #166534; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .amount-box strong { font-size: 2.2rem; color: #15803d; font-weight: 900; display: block; margin-top: 0.2rem; }
    
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
        <div class="sublogo">Comprobante Oficial de Donación</div>
      </div>
      <div>
        <span class="badge">${statusLabel}</span>
        <div class="code-box">Referencia: <strong>${donation.id}</strong></div>
      </div>
    </div>

    <div class="amount-box">
      <p>Monto del Aporte</p>
      <strong>${formatUsd(Number(donation.amount))}</strong>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <p><strong>Donante:</strong> ${donation.full_name}</p>
        <p><strong>Teléfono / WhatsApp:</strong> ${donation.phone || "No especificado"}</p>
        <p><strong>Correo electrónico:</strong> ${donation.email}</p>
      </div>
      <div class="info-block">
        <p><strong>Parroquia / Vicaría / Movimiento:</strong> ${donation.parish || "General"}</p>
        <p><strong>Método de pago:</strong> ${donation.payment_method || "Transferencia bancaria"}</p>
        <p><strong>Fecha de registro:</strong> ${dateStr}</p>
        ${donation.paid_at ? `<p><strong>Fecha de pago:</strong> ${formatOrderDate(donation.paid_at)}</p>` : ""}
      </div>
    </div>

    <div class="footer-note">
      <p>¡Agradecemos de corazón tu valioso aporte para hacer posible la Jornada Diocesana de la Juventud Jayaque 2026!</p>
      <p style="margin-top: 0.3rem; font-weight: 600;">"Tengan valor y síganme"</p>
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

export function downloadDonationReportPdf(
  donations: DonationRecord[],
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

  const paidDonations = donations.filter((d) => d.status === "paid");
  const pendingDonations = donations.filter((d) => d.status === "pending");
  const totalPaidAmount = paidDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Donaciones - ${periodLabel} - ${siteName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif; color: #1c232c; line-height: 1.5; padding: 2rem; background: #ffffff; }
    .report { max-width: 840px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 2.5rem; border-radius: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); }
    .header { border-bottom: 2px solid #2d808e; padding-bottom: 1.25rem; margin-bottom: 1.75rem; display: flex; justify-content: space-between; align-items: flex-start; }
    .logo { font-size: 1.6rem; font-weight: 800; color: #142838; letter-spacing: -0.02em; }
    .sublogo { color: #2d808e; font-size: 0.95rem; font-weight: 700; margin-top: 0.2rem; }
    .period-badge { background: #2d808e; color: #ffffff; padding: 0.4rem 1rem; border-radius: 999px; font-weight: 700; font-size: 0.9rem; text-align: right; }
    .meta-bar { font-size: 0.85rem; color: #64748b; margin-top: 0.4rem; text-align: right; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; text-align: center; }
    .kpi-card p { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: #64748b; margin-bottom: 0.2rem; }
    .kpi-card strong { font-size: 1.4rem; font-weight: 800; color: #142838; display: block; }
    .kpi-card span { font-size: 0.75rem; color: #64748b; }
    
    table.data-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    table.data-table th { background: #f1f5f9; color: #475569; text-align: left; padding: 0.6rem 0.85rem; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #cbd5e1; }
    table.data-table td { padding: 0.65rem 0.85rem; border-bottom: 1px solid #f1f5f9; font-size: 0.88rem; color: #1e293b; }
    table.data-table tr:nth-child(even) td { background: #f8fafc; }
    
    .status-pill { display: inline-block; padding: 0.15rem 0.55rem; border-radius: 999px; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; }
    .status-pill.paid { background: #dcfce7; color: #15803d; }
    .status-pill.pending { background: #fef3c7; color: #b45309; }
    .status-pill.failed { background: #fee2e2; color: #b91c1c; }
    
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
        <div class="sublogo">Informe · Reporte General de Donaciones</div>
      </div>
      <div>
        <div class="period-badge">Período: ${periodLabel}</div>
        <div class="meta-bar">Generado: ${dateStr}</div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <p>Total Registros</p>
        <strong>${donations.length}</strong>
        <span>${paidDonations.length} pagadas · ${pendingDonations.length} pendientes</span>
      </div>
      <div class="kpi-card">
        <p>Total Recaudado</p>
        <strong style="color: #15803d;">${formatUsd(totalPaidAmount)}</strong>
        <span>Solo pagos confirmados</span>
      </div>
      <div class="kpi-card">
        <p>Promedio por Donante</p>
        <strong>${formatUsd(paidDonations.length ? totalPaidAmount / paidDonations.length : 0)}</strong>
        <span>Donaciones efectivas</span>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Ref.</th>
          <th>Donante</th>
          <th>Teléfono</th>
          <th>Parroquia / Movimiento</th>
          <th style="text-align: right;">Monto</th>
          <th style="text-align: center;">Estado</th>
          <th style="text-align: right;">Fecha</th>
        </tr>
      </thead>
      <tbody>
        ${
          donations.length
            ? donations
                .map(
                  (d) => `
          <tr>
            <td><code style="font-size: 0.78rem;">${d.id.slice(0, 8)}…</code></td>
            <td><strong>${d.full_name}</strong></td>
            <td>${d.phone || "-"}</td>
            <td>${d.parish || "General"}</td>
            <td style="text-align: right;"><strong>${formatUsd(Number(d.amount))}</strong></td>
            <td style="text-align: center;">
              <span class="status-pill ${d.status}">${donationStatusLabel(d.status)}</span>
            </td>
            <td style="text-align: right; font-size: 0.8rem;">${d.created_at ? formatOrderDate(d.created_at) : "-"}</td>
          </tr>
        `,
                )
                .join("")
            : `<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 2rem;">No hay donaciones en este período.</td></tr>`
        }
      </tbody>
    </table>

    <div class="footer-note">
      <p>JDJ Jayaque 2026 · Panel de Administración de Donaciones</p>
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
