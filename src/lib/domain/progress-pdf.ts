import type { WeeklyProgressSummary } from "@/lib/domain/ecosystem/reporting";

export type ProgressPdfInput = {
  childName: string;
  parentName: string;
  weekLabel: string;
  summary: WeeklyProgressSummary;
  topicRows: Array<{ area: string; score: number; feedback: string | null }>;
};

export function buildWeeklyProgressHtml(input: ProgressPdfInput): string {
  const topics = input.topicRows
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.area)}</td><td>${row.score}%</td><td>${escapeHtml(row.feedback ?? "—")}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Zigo Haftalık Gelişim Raporu</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; margin: 32px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { color: #64748b; font-size: 13px; margin-bottom: 24px; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
    .stat { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
    .stat strong { display: block; font-size: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
    th { background: #f8fafc; }
    footer { margin-top: 32px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <h1>Zigo Haftalık Gelişim Raporu</h1>
  <p class="meta">${escapeHtml(input.weekLabel)} · ${escapeHtml(input.childName)} · Veli: ${escapeHtml(input.parentName)}</p>
  <div class="stats">
    <div class="stat"><strong>${input.summary.reportCount}</strong>Tamamlanan rapor</div>
    <div class="stat"><strong>${input.summary.averageScore}%</strong>Ortalama başarı</div>
    <div class="stat"><strong>${input.summary.completedBookings}</strong>Tamamlanan ders</div>
    <div class="stat"><strong>${escapeHtml(input.summary.topArea ?? "—")}</strong>Öne çıkan alan</div>
  </div>
  <h2>Bu hafta işlenen konular</h2>
  <table>
    <thead><tr><th>Alan</th><th>Başarı</th><th>Geri bildirim</th></tr></thead>
    <tbody>${topics || "<tr><td colspan=\"3\">Henüz rapor yok.</td></tr>"}</tbody>
  </table>
  <footer>Zigo · Doğrulanmış eğitim platformu · Bu rapor otomatik oluşturulmuştur.</footer>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
