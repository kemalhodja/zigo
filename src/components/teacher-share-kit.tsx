"use client";

import { useState } from "react";

type TeacherShareKitProps = {
  profileUrl: string;
  ogCardUrl: string;
  name: string;
  role: string;
  branches: string[];
  isOwnProfile: boolean;
};

export function TeacherShareKit({
  profileUrl,
  ogCardUrl,
  name,
  role,
  branches,
  isOwnProfile,
}: TeacherShareKitProps) {
  const [copied, setCopied] = useState(false);

  const branchText = branches.slice(0, 3).join(", ");
  const shareText = branchText
    ? `${name} (${branchText}) artık Zigo'da! Ders notları, kısa tanıtım videoları ve soru çözümleri için profilimi takip edebilirsiniz:`
    : `${name} artık Zigo'da! Eğitim paylaşımları ve ders içerikleri için profilimi inceleyebilirsiniz:`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${profileUrl}`)}`;

  function vibrate() {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // non-critical
      }
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      vibrate();
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // ignore clipboard errors
    }
  }

  async function handleNativeShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `${name} | Zigo`,
          text: shareText,
          url: profileUrl,
        });
        vibrate();
        return;
      } catch {
        // user cancelled or unsupported
      }
    }
    await handleCopyLink();
  }

  const badgeTitle =
    role === "teacher"
      ? "Öğretmen Paylaşım Kiti"
      : "Kurumsal Profil Paylaşım Kiti";

  return (
    <div className="mt-3 rounded-2xl border border-violet-200/80 bg-gradient-to-r from-violet-50/80 via-white to-amber-50/60 p-3.5 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-black text-night flex items-center gap-1.5">
            <span>🚀</span>
            <span>{isOwnProfile ? badgeTitle : "Bu Profili Paylaş"}</span>
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
            {isOwnProfile
              ? "Instagram biyografinize veya WhatsApp veli gruplarına tek tıkla ekleyin."
              : "Öğrenci ve veli gruplarıyla doğrudan paylaşın."}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={handleCopyLink}
          className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-[11px] font-black text-white shadow-xs transition hover:bg-violet-700"
        >
          <span>{copied ? "✅ Link Kopyalandı" : "🔗 Bio Linkini Kopyala"}</span>
        </button>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tap-scale inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-800 transition hover:bg-emerald-100"
        >
          <span>💬 WhatsApp</span>
        </a>

        <a
          href={ogCardUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={`zigo-profil-${name.toLowerCase().replace(/\s+/g, "-")}.png`}
          className="tap-scale inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-black text-amber-900 transition hover:bg-amber-100"
        >
          <span>🪪 Paylaşım Kartı (PNG)</span>
        </a>

        <button
          type="button"
          onClick={handleNativeShare}
          className="tap-scale inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-700 transition hover:bg-slate-50"
        >
          <span>📤 Paylaş</span>
        </button>
      </div>
    </div>
  );
}
