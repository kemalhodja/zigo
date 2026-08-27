"use client";

import { BadgeCheckIcon, CheckCircle2Icon, ExternalLinkIcon, MessageCircleQuestionIcon } from "lucide-react";
import Image from "next/image";

/**
 * Props for the FeedCard component.
 */
interface FeedCardProps {
  /** Information about the post author */
  author: {
    name: string;
    handle: string;
    avatarUrl?: string | null;
  };
  /** The user role of the author */
  role: "teacher" | "student" | "institution" | "publisher" | "parent" | "guest";
  /** Whether the author is a verified educator/institution */
  verified?: boolean;
  /** XP earned by a student post (if applicable) */
  xpEarned?: number;
  /** The main content of the post */
  body: string;
  /** Engagement metrics */
  engagement?: {
    understandCount?: number;
    questionCount?: number;
  };
  /** Formatted time string (e.g., "1s", "2h", "5d") */
  timeAgo?: string;
  /** External URL associated with the post */
  externalUrl?: string | null;
}

/**
 * FeedCard displays a single post in the social feed.
 * It features tactile hover states and role-based badges (verified tick, XP pill).
 */
export function FeedCard({
  author,
  role,
  verified,
  xpEarned,
  body,
  engagement = { understandCount: 0, questionCount: 0 },
  timeAgo = "1s",
  externalUrl
}: FeedCardProps) {
  const isEducator = role === "teacher" || role === "institution" || role === "publisher";
  
  return (
    <article 
      className="mb-4 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
      aria-label={`${author.name} tarafından gönderildi`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-slate-50 border border-slate-200 shadow-sm">
            {author.avatarUrl ? (
              <Image src={author.avatarUrl} alt={author.name} fill className="object-cover" />
            ) : (
              <div 
                className="flex h-full w-full items-center justify-center text-slate-400 font-bold bg-gradient-to-br from-slate-50 to-slate-100"
                aria-hidden="true"
              >
                {author.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-900 tracking-tight">{author.name}</span>
              {isEducator && verified && (
                <span title="Doğrulanmış eğitimci/kurum" className="flex items-center drop-shadow-[0_2px_4px_rgba(59,130,246,0.2)]">
                  <BadgeCheckIcon 
                    className="h-4 w-4 text-blue-500" 
                    aria-label="Doğrulanmış hesap"
                  />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-medium hover:text-slate-700 transition-colors cursor-pointer">@{author.handle}</span>
              <span className="text-[10px]" aria-hidden="true">•</span>
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
        
        {/* XP Badge for students */}
        {role === "student" && xpEarned !== undefined && xpEarned > 0 && (
          <div 
            className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1 text-xs font-bold text-amber-700 shadow-sm"
            aria-label={`${xpEarned} deneyim puanı kazanıldı`}
          >
            +{xpEarned} xp
          </div>
        )}
      </div>

      {/* Body */}
      <div className="mt-4 text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap">
        {body}
      </div>

      {/* External Link */}
      {externalUrl && (
        <a 
          href={externalUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="mt-3 flex items-center justify-between gap-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:bg-slate-100 active:scale-[0.98]"
        >
          <div className="flex flex-col truncate">
            <span className="text-sm font-bold text-slate-800">Bağlantıyı Ziyaret Et</span>
            <span className="truncate text-xs font-semibold text-slate-500">{externalUrl}</span>
          </div>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
            <ExternalLinkIcon className="h-4 w-4 text-slate-600" />
          </div>
        </a>
      )}

      {/* Footer / Actions */}
      <div className="mt-5 flex items-center gap-4 border-t border-slate-100 pt-3">
        <button 
          className="group flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-500 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 active:scale-95"
          aria-label="Gönderiyi anladım"
        >
          <CheckCircle2Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-active:scale-90" aria-hidden="true" />
          <span>Anladım {engagement.understandCount ? `(${engagement.understandCount})` : ""}</span>
        </button>
        <button 
          className="group flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-500 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-95"
          aria-label="Gönderi hakkında soru sor"
        >
          <MessageCircleQuestionIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-active:scale-90" aria-hidden="true" />
          <span>Soru sor {engagement.questionCount ? `(${engagement.questionCount})` : ""}</span>
        </button>
      </div>
    </article>
  );
}
