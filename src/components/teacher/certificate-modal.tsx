"use client";

import { useEffect, useRef } from "react";
import { Award, Download, Share2, X } from "lucide-react";

export interface CertificateData {
  studentName: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  correct: number;
  total: number;
  teacherName: string;
  teacherTitle?: string;
  date?: string;
  schoolName?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: CertificateData;
}

export function CertificateModal({ isOpen, onClose, data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const date = data.date ?? new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  // Draw certificate on canvas for print/share
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 900;
    const H = 640;
    canvas.width = W;
    canvas.height = H;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(0.5, "#1e1b4b");
    grad.addColorStop(1, "#0f172a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Gold border outer
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Gold border inner
    ctx.strokeStyle = "#b8962e";
    ctx.lineWidth = 2;
    ctx.strokeRect(32, 32, W - 64, H - 64);

    // Decorative corner pattern
    const corners = [[50, 50], [W - 50, 50], [50, H - 50], [W - 50, H - 50]];
    corners.forEach(([cx, cy]) => {
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx as number, cy as number, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#d4af3740";
      ctx.fill();
    });

    // Header: ZIGO
    ctx.textAlign = "center";
    ctx.fillStyle = "#d4af37";
    ctx.font = "bold 18px system-ui";
    ctx.letterSpacing = "0.3em";
    ctx.fillText("ZIGO EĞİTİM PLATFORMU", W / 2, 90);

    // Certificate title
    ctx.font = "bold 44px Georgia, serif";
    ctx.fillStyle = "#ffffff";
    ctx.letterSpacing = "0";
    ctx.fillText("BAŞARI SERTİFİKASI", W / 2, 155);

    // Decorative line under title
    const lineGrad = ctx.createLinearGradient(W / 2 - 180, 0, W / 2 + 180, 0);
    lineGrad.addColorStop(0, "transparent");
    lineGrad.addColorStop(0.5, "#d4af37");
    lineGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 180, 168);
    ctx.lineTo(W / 2 + 180, 168);
    ctx.stroke();

    // "Bu sertifika"
    ctx.font = "18px system-ui";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Bu sertifika aşağıdaki öğrencinin başarısını tescil eder:", W / 2, 210);

    // Student name
    ctx.font = "bold 38px Georgia, serif";
    ctx.fillStyle = "#d4af37";
    ctx.fillText(data.studentName, W / 2, 262);

    // Achievement description
    ctx.font = "18px system-ui";
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(`"${data.quizTitle}" sınavında`, W / 2, 310);

    // Score highlight
    const pct = Math.round((data.score / Math.max(data.maxScore, 1)) * 100);
    ctx.font = "bold 48px Georgia, serif";
    ctx.fillStyle = pct >= 85 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#64748b";
    ctx.fillText(`${data.score} / ${data.maxScore} Puan`, W / 2, 368);

    ctx.font = "bold 16px system-ui";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`${data.correct} Doğru · ${data.total - data.correct} Yanlış · ${pct}% Başarı`, W / 2, 398);

    // Separator
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, 425);
    ctx.lineTo(W - 80, 425);
    ctx.stroke();

    // Date and school
    ctx.font = "15px system-ui";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "left";
    ctx.fillText(`📅 ${date}`, 90, 462);
    if (data.schoolName) {
      ctx.textAlign = "right";
      ctx.fillText(`🏫 ${data.schoolName}`, W - 90, 462);
    }

    // Teacher signature area
    ctx.textAlign = "center";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 120, 530);
    ctx.lineTo(W / 2 + 120, 530);
    ctx.stroke();

    ctx.font = "bold 16px system-ui";
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(data.teacherName, W / 2, 553);
    ctx.font = "13px system-ui";
    ctx.fillStyle = "#64748b";
    ctx.fillText(data.teacherTitle ?? "Öğretmen", W / 2, 572);

    // Star decoration
    ctx.font = "22px system-ui";
    ctx.fillText("⭐ ⭐ ⭐", W / 2, 610);

  }, [isOpen, data, date]);

  function handleDownload() {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `sertifika-${data.studentName.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvasRef.current.toDataURL("image/png", 1.0);
    link.click();
    if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(
      `🏆 ${data.studentName} öğrencim "${data.quizTitle}" sınavında ${data.score}/${data.maxScore} puan aldı! Tebrikler! 🎉\n\nZigo Eğitim Platformu`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  function handlePrint() {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Sertifika</title><style>body{margin:0;background:#000}img{max-width:100%;display:block}</style></head><body><img src="${dataUrl}" onload="window.print();window.close()" /></body></html>`);
    win.document.close();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <div className="flex items-center gap-2">
            <Award className="size-5 text-yellow-400" />
            <span className="text-sm font-black text-white">Başarı Sertifikası</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Canvas Preview */}
        <div className="p-4 bg-black overflow-auto">
          <canvas
            ref={canvasRef}
            className="w-full rounded-xl"
            style={{ imageRendering: "crisp-edges" }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 border-t border-slate-700 p-4 sm:flex-row">
          <button
            type="button"
            onClick={handleDownload}
            className="tap-scale flex flex-1 items-center justify-center gap-2 rounded-2xl bg-yellow-500 py-3 text-sm font-black text-black hover:bg-yellow-400 transition"
          >
            <Download className="size-4" />
            PNG İndir
          </button>
          <button
            type="button"
            onClick={handleWhatsApp}
            className="tap-scale flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white hover:bg-emerald-500 transition"
          >
            <Share2 className="size-4" />
            WhatsApp Paylaş
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="tap-scale flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-700 py-3 text-sm font-black text-white hover:bg-slate-600 transition"
          >
            🖨️ Yazdır
          </button>
        </div>
      </div>
    </div>
  );
}
