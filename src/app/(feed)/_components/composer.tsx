"use client";

import { FlameIcon, ImageIcon, LinkIcon,UserIcon, VideoIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

/**
 * Props for the Composer component.
 */
interface ComposerProps {
  /** User role determining the visibility/state of the composer */
  userRole: string | null;
  /** Current streak days for the user (if any) */
  streakDays?: number;
  /** Optional avatar URL of the user */
  avatarUrl?: string | null;
}

/**
 * Composer is the post creation area.
 * It simulates a rich text editor and features premium focus states.
 */
export function Composer({ userRole, streakDays = 0, avatarUrl }: ComposerProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  const isParent = userRole === "parent";
  const isGuest = userRole === "guest" || !userRole;
  
  if (isGuest) return null;

  if (isParent) {
    return null;
  }

  return (
    <div 
      className={`mb-4 flex flex-col gap-4 rounded-2xl border bg-white p-5 transition-all duration-300 ${
        isFocused 
          ? "border-amber-300 shadow-[0_8px_30px_rgba(245,158,11,0.1)] ring-4 ring-amber-500/10" 
          : "border-slate-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
      }`}
    >
      {/* Header section with Streak indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-black uppercase tracking-wider text-slate-500">Gönderi Oluştur</h2>
        {streakDays > 0 && (
          <div 
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1 text-xs font-bold text-amber-700 shadow-sm"
            aria-label={`${streakDays} Günlük Seri`}
          >
            <FlameIcon className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
            {streakDays} Seri
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="flex gap-4">
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-slate-50 border border-slate-200 shadow-sm">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Profil resminiz" fill className="object-cover" />
          ) : (
             <div className="flex h-full w-full items-center justify-center text-slate-400" aria-hidden="true">
               <UserIcon className="h-6 w-6" />
             </div>
          )}
        </div>
        
        <div className="flex-1">
          <textarea
            placeholder="Bugün ne öğrendin?"
            className="min-h-[50px] w-full resize-none bg-transparent pt-3 text-[15px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none"
            aria-label="Gönderi metni"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={isFocused ? 3 : 1}
          />
        </div>
      </div>
      
      {/* Action Toolbar */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex flex-wrap items-center gap-1 sm:pl-16">
          <button 
            className="group flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            aria-label="Fotoğraf ekle"
          >
            <ImageIcon className="h-4 w-4 transition-transform group-hover:scale-110" aria-hidden="true" />
            <span className="hidden sm:inline">Fotoğraf</span>
          </button>
          <button 
            className="group flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            aria-label="Video ekle"
          >
            <VideoIcon className="h-4 w-4 transition-transform group-hover:scale-110" aria-hidden="true" />
            <span className="hidden sm:inline">Video</span>
          </button>
          <button 
            className="group flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-purple-50 hover:text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            aria-label="Bağlantı ekle"
          >
            <LinkIcon className="h-4 w-4 transition-transform group-hover:scale-110" aria-hidden="true" />
            <span className="hidden sm:inline">Bağlantı</span>
          </button>
        </div>
        <button 
          className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-amber-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/30 active:translate-y-0 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2"
          aria-label="Gönderiyi Paylaş"
        >
          Paylaş
        </button>
      </div>
    </div>
  );
}
