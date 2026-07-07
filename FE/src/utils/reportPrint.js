const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
})[character]);

const multiline = (value, fallback = '—') => escapeHtml(value || fallback).replaceAll('\n', '<br>');

export const printReportPdf = (report, { locale = 'vi-VN', labels }) => {
    const formatDate = (value) => value
        ? new Date(value).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
        : labels.notAvailable;
    const reviewer = report.reviewer_name || labels.notReviewed;
    const approval = labels.approval[report.approval_status] || report.approval_status;
    const status = labels.taskStatus[report.proposed_status] || report.proposed_status;
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) return false;
    printWindow.opener = null;

    printWindow.document.write(`<!doctype html>
<html lang="${locale.startsWith('vi') ? 'vi' : 'en'}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(labels.documentTitle)} #${escapeHtml(report.id)}</title>
<style>
@page { size: A4; margin: 16mm; }
* { box-sizing: border-box; }
body { margin: 0; color: #172033; font-family: Arial, "Segoe UI", sans-serif; font-size: 12px; line-height: 1.55; }
.header { border-bottom: 3px solid #4f46e5; padding-bottom: 16px; margin-bottom: 18px; }
.brand { color: #4f46e5; font-size: 12px; font-weight: 800; letter-spacing: .16em; }
h1 { margin: 6px 0 4px; font-size: 24px; }
.subtitle { color: #64748b; }
.meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 18px 0; }
.card, .section { border: 1px solid #dbe3ef; border-radius: 10px; padding: 12px 14px; break-inside: avoid; }
.card span, .section h2, .signature span { display: block; color: #64748b; font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.card strong { display: block; margin-top: 5px; font-size: 13px; }
.section { margin-top: 12px; }
.section h2 { margin: 0 0 8px; }
.section p { margin: 0; white-space: normal; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 30px; page-break-inside: avoid; }
.signature { min-height: 115px; border-top: 1px solid #94a3b8; padding-top: 10px; text-align: center; }
.signature strong { display: block; margin-top: 42px; font-size: 14px; }
.signature small { color: #64748b; }
.verification { margin-top: 18px; padding: 10px 12px; background: #eef2ff; border-left: 4px solid #4f46e5; color: #3730a3; }
.footer { margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 8px; color: #64748b; font-size: 10px; text-align: center; }
@media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style>
</head>
<body>
<header class="header">
  <div class="brand">VDCMS</div>
  <h1>${escapeHtml(labels.documentTitle)}</h1>
  <div class="subtitle">#${escapeHtml(report.id)} · ${escapeHtml(report.project_name)} · ${escapeHtml(report.task_title)}</div>
</header>
<div class="meta">
  <div class="card"><span>${escapeHtml(labels.engineer)}</span><strong>${escapeHtml(report.engineer_name)}</strong></div>
  <div class="card"><span>${escapeHtml(labels.createdAt)}</span><strong>${escapeHtml(formatDate(report.created_at))}</strong></div>
  <div class="card"><span>${escapeHtml(labels.approvalStatus)}</span><strong>${escapeHtml(approval)}</strong></div>
</div>
<section class="section"><h2>${escapeHtml(labels.content)}</h2><p>${multiline(report.content)}</p></section>
<div class="grid">
  <section class="section"><h2>${escapeHtml(labels.workQuantity)}</h2><p>${multiline(report.work_quantity)}</p></section>
  <section class="section"><h2>${escapeHtml(labels.nextPlan)}</h2><p>${multiline(report.next_plan)}</p></section>
  <section class="section"><h2>${escapeHtml(labels.blockers)}</h2><p>${multiline(report.blockers)}</p></section>
  <section class="section"><h2>${escapeHtml(labels.safetyNotes)}</h2><p>${multiline(report.safety_notes)}</p></section>
</div>
<div class="meta">
  <div class="card"><span>${escapeHtml(labels.proposedStatus)}</span><strong>${escapeHtml(status)}</strong></div>
  <div class="card"><span>${escapeHtml(labels.reviewedBy)}</span><strong>${escapeHtml(reviewer)}</strong></div>
  <div class="card"><span>${escapeHtml(labels.reviewedAt)}</span><strong>${escapeHtml(formatDate(report.reviewed_at))}</strong></div>
</div>
<section class="section"><h2>${escapeHtml(labels.reviewNote)}</h2><p>${multiline(report.review_note, labels.noReviewNote)}</p></section>
<div class="signatures">
  <div class="signature"><span>${escapeHtml(labels.engineerSignature)}</span><strong>${escapeHtml(report.engineer_name)}</strong><small>${escapeHtml(formatDate(report.created_at))}</small></div>
  <div class="signature"><span>${escapeHtml(labels.reviewerSignature)}</span><strong>${escapeHtml(reviewer)}</strong><small>${escapeHtml(formatDate(report.reviewed_at))}</small></div>
</div>
<div class="verification"><strong>${escapeHtml(labels.electronicSignature)}</strong><br>${escapeHtml(labels.verificationText)} #${escapeHtml(report.id)}</div>
<footer class="footer">${escapeHtml(labels.generatedAt)} ${escapeHtml(formatDate(new Date()))}</footer>
</body>
</html>`);
    printWindow.document.close();
    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
    }, 300);
    return true;
};
