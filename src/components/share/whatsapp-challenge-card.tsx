"use client";

import { Check, Copy, Flame, MessageCircle, Sparkles, Trophy, Users } from "lucide-react";
import { useMemo, useState } from "react";

export type WhatsAppChallengeCardProps = {
  title: string;
  score: number;
  type: "quiz" | "duel";
  detailText?: string;
  challengeUrl?: string;
  rewardPoints?: number;
  defaultFriendName?: string;
  className?: string;
};

export function WhatsAppChallengeCard({
  title,
  score,
  type,
  detailText,
  challengeUrl,
  rewardPoints = 50,
  defaultFriendName = "",
  className = "",
}: WhatsAppChallengeCardProps) {
  const [friendName, setFriendName] = useState(defaultFriendName);
  const [copied, setCopied] = useState(false);

  // Compute shareable URL
  const resolvedUrl = useMemo(() => {
    if (challengeUrl) return challengeUrl;
    if (typeof window !== "undefined") return window.location.href;
    return "https://zigo.app";
  }, [challengeUrl]);

  // Generate dynamic viral WhatsApp challenge message
  const shareMessage = useMemo(() => {
    const friendGreeting = friendName.trim() ? `${friendName.trim()}, ` : "";
    const targetLabel = type === "duel" ? "canlı düelloda" : `"${title}" testinde`;

    return [
      `🔥 *ZİGO MEYDAN OKUMA!*`,
      `${friendGreeting}Zigo'da ${targetLabel} *${score} PUAN* aldım! ${detailText ? `(${detailText})` : ""}`,
      ``,
      `Sana meydan okuyorum, bakalım beni geçebilecek misin? ⚔️`,
      `Sen de bu linkten çözersen *İKİMİZE DE +${rewardPoints} LİG PUANI* eklenecek! 🏆`,
      ``,
      `👉 Meydan okumayı kabul et: ${resolvedUrl}`,
    ].join("\n");
  }, [friendName, type, title, score, detailText, rewardPoints, resolvedUrl]);

  // Construct WhatsApp web/app intent URL
  const whatsappUrl = useMemo(() => {
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
  }, [shareMessage]);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareMessage}\n\n${resolvedUrl}`);
      }
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(20);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppClick = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(25);
    }
    if (typeof window !== "undefined") {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
  };

  const buttonLabel = friendName.trim()
    ? `${friendName.trim()}'e WhatsApp'tan Meydan Oku`
    : "Arkadaşına WhatsApp'tan Meydan Oku";

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/70 p-5 text-left shadow-md transition-all sm:p-6 ${className}`}
    >
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-300/20 blur-2xl" />

      {/* Reward pill header */}
      <div className="flex items-center justify-between gap-2 border-b border-emerald-100/80 pb-3.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs">
            <Flame className="size-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 sm:text-base">Arkadaşına Meydan Oku</h4>
            <p className="text-[11px] font-bold text-slate-500">1v1 Karşılıklı Skor Kapışması</p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1 text-xs font-black text-amber-950 shadow-xs">
          <Sparkles className="size-3.5" />
          <span>+{rewardPoints} Lig Puanı</span>
        </div>
      </div>

      {/* Incentive explanation banner */}
      <div className="mt-3.5 rounded-2xl border border-emerald-200/60 bg-emerald-50/60 p-3 text-xs font-bold leading-relaxed text-emerald-950">
        <span className="inline-flex items-center gap-1 font-black text-emerald-800">
          <Trophy className="size-3.5 text-amber-600 inline shrink-0" />
          Kazan-Kazan Bonusu:
        </span>{" "}
        Arkadaşın bu meydan okumayı çözdüğünde,{" "}
        <span className="font-black text-emerald-900 underline decoration-emerald-400">
          ikiniz de anında +{rewardPoints} Zigo Lig Puanı
        </span>{" "}
        kazanırsınız!
      </div>

      {/* Friend name personalizer input */}
      <div className="mt-3.5">
        <label htmlFor="friendNameInput" className="block text-[11px] font-black uppercase tracking-wider text-slate-500">
          Meydan Okunacak Arkadaşın (İsteğe Bağlı)
        </label>
        <div className="relative mt-1">
          <input
            id="friendNameInput"
            type="text"
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
            placeholder="Örn: Ahmet, Ayşe, Kaan..."
            maxLength={30}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
          <Users className="pointer-events-none absolute right-3 top-2.5 size-4 text-slate-400" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleWhatsAppClick}
          className="tap-scale flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-xs font-black text-white shadow-md transition-all hover:brightness-105 active:scale-[0.98]"
        >
          <MessageCircle className="size-4 shrink-0 fill-current" />
          <span className="truncate">{buttonLabel}</span>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="tap-scale flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-2xs transition-all hover:bg-slate-50 active:scale-[0.98]"
          title="Meydan okuma linkini kopyala"
        >
          {copied ? (
            <>
              <Check className="size-4 text-emerald-600" />
              <span className="text-emerald-700 font-black">Kopyalandı!</span>
            </>
          ) : (
            <>
              <Copy className="size-4 text-slate-500" />
              <span>Linki Kopyala</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
