"use client";

import { Bell, Command, Crown, MessageSquare, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { ViewerRole } from "@/lib/domain/role-theme";

type DesktopTopBarProps = {
  canCreateSocialPost?: boolean;
  isPlatformAdmin?: boolean;
  roleAccentLabel: string;
  teacherInboxCount?: number;
  unreadCount: number;
  viewerRole: ViewerRole;
};

export function DesktopTopBar({
  canCreateSocialPost = false,
  isPlatformAdmin = false,
  roleAccentLabel,
  teacherInboxCount = 0,
  unreadCount = 0,
  viewerRole,
}: DesktopTopBarProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Global keyboard shortcut: Ctrl+K or Cmd+K focuses search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/explore?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/explore");
    }
  }

  return (
    <header
      aria-label="Masaüstü Üst Çubuk"
      className="hidden lg:flex items-center justify-between gap-4 mb-5 rounded-2xl border border-slate-200/80 bg-white/95 px-5 py-3 shadow-xs backdrop-blur-xl select-none"
    >
      {/* Search Input with Shortcut */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          ref={searchInputRef}
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ders, konu, öğretmen veya zeka oyunu ara..."
          className="w-full rounded-xl bg-slate-100/90 pl-10 pr-16 py-2 text-xs font-bold text-night placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20 border border-transparent focus:border-[#0047FF]/30 transition"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded-md bg-white border border-slate-200/80 px-1.5 py-0.5 text-[10px] font-black text-slate-400 pointer-events-none shadow-3xs">
          <Command className="h-2.5 w-2.5" />
          <span>K</span>
        </div>
      </form>

      {/* Right Controls: Role Badge, Zigo Plus Pill, Notifications, Quick Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Zigo Plus Promo Pill */}
        <Link
          href="/pricing"
          className="tap-scale flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-50 via-fuchsia-50 to-pink-50 border border-violet-100/80 px-3 py-1.5 text-xs font-black text-violet-800 hover:brightness-95 transition"
        >
          <Crown className="h-3.5 w-3.5 text-violet-600" />
          <span>Zigo Plus</span>
          <span className="rounded-md bg-violet-600 px-1.5 py-0.5 text-[10px] text-white">
            %50 Fırsat
          </span>
        </Link>

        {/* Lesson Requests (Teachers / Platform / Parent) */}
        {viewerRole === "teacher" || isPlatformAdmin ? (
          <Link
            href="/teacher/lessons"
            aria-label="Ders Talepleri"
            title="Gelen Özel Ders Talepleri"
            className="tap-scale relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-night transition"
          >
            <MessageSquare className="h-4 w-4" />
            {teacherInboxCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[9px] font-black text-white">
                {teacherInboxCount > 9 ? "9+" : teacherInboxCount}
              </span>
            ) : null}
          </Link>
        ) : null}

        {/* Notifications Bell */}
        <Link
          href="/notifications"
          aria-label="Bildirimler"
          title="Bildirimler"
          className="tap-scale relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-night transition"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Link>

        {/* Quick Post CTA */}
        {canCreateSocialPost || isPlatformAdmin ? (
          <Link
            href="/create"
            className="tap-scale flex items-center gap-1.5 rounded-xl bg-[#0047FF] px-3.5 py-1.5 text-xs font-black text-white shadow-xs hover:bg-[#003be0] transition active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Paylaş</span>
          </Link>
        ) : null}

        {/* Role Accent Label */}
        {roleAccentLabel ? (
          <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
            {roleAccentLabel}
          </span>
        ) : null}
      </div>
    </header>
  );
}
