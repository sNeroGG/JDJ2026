import html2pdf from "html2pdf.js";
import type { DonationRecord } from "./donations.js";
import { donationStatusLabel } from "./donations.js";
import { formatOrderDate, formatUsd } from "./store.js";

export function buildDonationPdfHtml(
  donation: DonationRecord,
  siteName = "JDJ Jayaque 2026"
): string {
  const dateStr = donation.created_at
    ? formatOrderDate(donation.created_at)
    : "Reciente";

  const statusLabel = donationStatusLabel(donation.status).toUpperCase();

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante de Donación ${donation.id} - ${siteName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif; color: #1c232c; line-height: 1.5; padding: 2rem; background: #ffffff; }
    .invoice { max-width: 720px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 2.5rem; border-radius: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); background: #ffffff; }
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
</body>
</html>`;
}

export function downloadDonationReceiptPdf(
  donation: DonationRecord,
  siteName = "JDJ Jayaque 2026",
) {
  const html = buildDonationPdfHtml(donation, siteName) + `
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

export async function generateDonationPdfBlob(
  donation: DonationRecord,
  siteName = "JDJ Jayaque 2026"
): Promise<Blob> {
  const html = buildDonationPdfHtml(donation, siteName);
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = "720px";
  container.style.background = "#ffffff";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const targetElement = container.querySelector(".invoice") || container;
    const worker = (html2pdf as any)()
      .set({
        margin: [10, 10, 10, 10],
        filename: `Donacion_${donation.id}.pdf`,
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

  const total = donations.reduce(
    (sum, item) => sum + (item.status === "paid" ? Number(item.amount || 0) : 0),
    0,
  );

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Donaciones - ${periodLabel} - ${siteName}</title>
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
        <div class="sublogo">Reporte de Donaciones · ${periodLabel}</div>
      </div>
      <div style="text-align: right; font-size: 0.85rem; color: #64748b;">
        Generado: <strong>${dateStr}</strong><br>
        Recaudación total: <strong>${formatUsd(total)}</strong>
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
