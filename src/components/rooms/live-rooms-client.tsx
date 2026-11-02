"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAudio } from "@/hooks/use-audio";
import { useFocusRoom, useFocusRoomCounts } from "@/hooks/use-focus-room";
import { trackEvent } from "@/lib/client/analytics";
import { triggerHaptic } from "@/lib/client/haptics";
import {
  FOCUS_ROOMS,
  formatCountdown,
  getRoomBySlug,
  getRoomPhase,
  type RoomCompetitor,
  type RoomPhase,
} from "@/lib/domain/focus-rooms";

export type RoomViewer = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

const ACTIVE_ROOM_STORAGE_KEY = "zigo:focus_room:active_slug";
const FOCUS_GOAL_STORAGE_KEY = "zigo:focus_room:goal_note";

function AvatarStack({ names }: { names: string[] }) {
  const shown = names.slice(0, 4);
  const rest = names.length - shown.length;
  return (
    <div className="flex items-center gap-1">
      {shown.map((name, i) => (
        <span
          key={`${name}-${i}`}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-[0.6rem] font-black text-indigo-700 ring-2 ring-white"
          title={name}
        >
          {(name || "Ö").slice(0, 2).toUpperCase()}
        </span>
      ))}
      {rest > 0 && (
        <span className="text-xs font-black text-slate-400">+{rest}</span>
      )}
    </div>
  );
}

function SyncedPomodoroPanel({
  slug,
  roomName,
  roomDescription,
  viewer,
  onSelectRoom,
  onLeaveRoom,
}: {
  slug: string;
  roomName: string;
  roomDescription: string;
  viewer: RoomViewer;
  onSelectRoom: (nextSlug: string) => void;
  onLeaveRoom: () => void;
}) {
  const [phase, setPhase] = useState<RoomPhase>(() => getRoomPhase());
  const [completedBlocks, setCompletedBlocks] = useState<number>(0);
  const [focusGoalNote, setFocusGoalNote] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<RoomCompetitor[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const { playSound } = useAudio();

  const { participants, connected, leave } = useFocusRoom({
    slug,
    enabled: true,
    participant: { user_id: viewer.id, display_name: viewer.name, avatar_url: viewer.avatarUrl },
  });

  // Restore room-specific block counter and focus goal from localStorage
  useEffect(() => {
    try {
      const savedBlocks = localStorage.getItem(`zigo:focus_room:${slug}:blocks`);
      setCompletedBlocks(savedBlocks ? parseInt(savedBlocks, 10) || 0 : 0);
      const savedGoal = localStorage.getItem(FOCUS_GOAL_STORAGE_KEY);
      if (savedGoal) setFocusGoalNote(savedGoal);
    } catch {
      // Ignore storage access errors
    }
  }, [slug]);

  // Fetch leaderboard
  useEffect(() => {
    let isMounted = true;
    setLoadingLeaderboard(true);
    async function fetchLeaderboard() {
      try {
        const res = await fetch(`/api/rooms/leaderboard?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted && Array.isArray(json?.data?.competitors)) {
          setLeaderboard(json.data.competitors);
        }
      } catch (err) {
        console.warn("Liderlik tablosu alınamadı:", err);
      } finally {
        if (isMounted) setLoadingLeaderboard(false);
      }
    }
    void fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [slug]);

  const [showFloatingXp, setShowFloatingXp] = useState(false);

  // Handle phase change and block completions
  useEffect(() => {
    let currentBlock = getRoomPhase().blockIndex;
    let currentPhaseType = getRoomPhase().phase;

    const timer = setInterval(() => {
      const nextPhase = getRoomPhase(Date.now());
      setPhase(nextPhase);

      // Block finished when switching from focus to break
      if (currentPhaseType === "focus" && nextPhase.phase === "break") {
        playSound("perfect");
        triggerHaptic("success");
        setShowFloatingXp(true);
        setTimeout(() => setShowFloatingXp(false), 2200);

        // Register block completion if signed in (not guest)
        if (!viewer.id.startsWith("guest-")) {
          fetch("/api/rooms/leaderboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, blockIndex: currentBlock }),
          }).catch(console.warn);
        }

        setCompletedBlocks((prev) => {
          const next = prev + 1;
          try {
            localStorage.setItem(`zigo:focus_room:${slug}:blocks`, String(next));
          } catch {
            // Ignore storage errors
          }
          return next;
        });
      }

      currentBlock = nextPhase.blockIndex;
      currentPhaseType = nextPhase.phase;
    }, 1000);
    return () => clearInterval(timer);
  }, [slug, playSound, viewer.id]);

  const progressPct = useMemo(() => {
    const total = phase.phase === "focus" ? 25 * 60 : 5 * 60;
    return Math.min(100, Math.max(0, Math.round(((total - phase.secondsRemaining) / total) * 100)));
  }, [phase]);

  return (
    <div className="space-y-5">
      {/* Quick Room Switcher Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FOCUS_ROOMS.map((room) => {
          const isCurrent = room.slug === slug;
          return (
            <button
              key={room.slug}
              type="button"
              onClick={() => {
                if (!isCurrent) {
                  triggerHaptic("light");
                  onSelectRoom(room.slug);
                }
              }}
              className={`tap-scale shrink-0 rounded-full px-3.5 py-1.5 text-xs font-black transition ${
                isCurrent
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {room.name}
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-500">
              {connected ? "● Canlı Odak Odası Aktif" : "● Senkron Sayaç Aktif"}
            </p>
            <h3 className="mt-0.5 text-xl font-black text-night">{roomName}</h3>
            <p className="mt-0.5 text-xs font-medium text-slate-500">{roomDescription}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              leave();
              trackEvent("focus_room_left", { slug });
              onLeaveRoom();
            }}
            className="tap-scale shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50"
          >
            Odalar Listesi
          </button>
        </div>

        {/* Personal Focus Goal Input (State Persistent) */}
        <div className="mb-4">
          <input
            type="text"
            value={focusGoalNote}
            onChange={(e) => {
              const next = e.target.value;
              setFocusGoalNote(next);
              try {
                localStorage.setItem(FOCUS_GOAL_STORAGE_KEY, next);
              } catch {
                // Ignore
              }
            }}
            placeholder="🎯 Bu bloktaki hedefin ne? (Örn: 30 paragraf sorusu çözmek)"
            maxLength={100}
            className="w-full rounded-xl border border-indigo-100 bg-white/90 px-3.5 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
          />
        </div>

        <div className="relative mb-5 rounded-2xl bg-slate-900 p-6 text-center shadow-lg">
          {showFloatingXp && (
            <div className="floating-xp-badge absolute left-1/2 top-4 -translate-x-1/2 z-20 pointer-events-none">
              ⚡ +30 Odak Puanı!
            </div>
          )}
          <p
            className={`mb-1 text-xs font-black uppercase tracking-widest ${
              phase.phase === "focus" ? "text-emerald-400" : "text-amber-300"
            }`}
          >
            {phase.phase === "focus" ? "🎯 Odak Bloğu (Yarışma Aktif)" : "☕ Mola Zamanı"}
          </p>
          <p className="font-mono text-5xl font-black tracking-wider text-white tabular-nums">
            {formatCountdown(phase.secondsRemaining)}
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full transition-all duration-1000 ${
                phase.phase === "focus" ? "bg-emerald-500" : "bg-amber-400"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[0.7rem] font-bold text-slate-400">
            <span>Senkronize 25 dk odak / 5 dk mola</span>
            <span className="text-amber-300 font-black">
              Tamamladığın: {completedBlocks} Blok 🏆
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AvatarStack names={participants.map((p) => p.display_name)} />
            <span className="text-sm font-black text-slate-700">
              {Math.max(1, participants.length)} kişi şu an bu odada çalışıyor
            </span>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-600">
            Her blok sonunda +30 puan & liderlik yükselişi 🎉
          </span>
        </div>
      </div>

      {/* Personal Timer Shortcut Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-white p-4 shadow-xs">
        <div>
          <p className="text-xs font-black text-violet-700">🍅 Kendi Süreni Kendin mi Belirlemek İstiyorsun?</p>
          <p className="text-xs font-medium text-slate-500">
            15-60 dakikalık kişisel Pomodoro sayacını ve haftalık çalışma planını kullanabilirsin.
          </p>
        </div>
        <Link
          href="/focus"
          className="tap-scale shrink-0 rounded-xl bg-violet-50 px-4 py-2 text-xs font-black text-violet-700 transition hover:bg-violet-100"
        >
          Kişisel Pomodoro ➔
        </Link>
      </div>

      {/* In-Room Competitive Leaderboard */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <h4 className="font-black text-slate-900">Oda Liderlik Tablosu</h4>
          </div>
          <span className="text-xs font-bold text-slate-400">Bu Haftanın En Çok Odaklananları</span>
        </div>

        {loadingLeaderboard ? (
          <div className="py-6 text-center text-xs font-bold text-slate-400 animate-pulse">
            Sıralama yükleniyor...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-6 text-center text-xs font-bold text-slate-400">
            Bu hafta bu odada henüz tamamlanan blok yok. İlk bloğu tamamlayarak 1. sıraya yerleş!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leaderboard.map((c, idx) => (
              <div
                key={c.user_id}
                className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50/70 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[0.7rem] font-black ${
                      idx === 0
                        ? "bg-amber-400 text-white"
                        : idx === 1
                        ? "bg-slate-300 text-slate-800"
                        : idx === 2
                        ? "bg-amber-700 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    {c.avatar_url ? (
                      <img
                        src={c.avatar_url}
                        alt=""
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[0.6rem] font-black">
                        {(c.full_name || "Ö").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-black text-slate-800">
                      {c.full_name || "Öğrenci"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <span className="text-xs font-black text-indigo-600">
                    {c.blocks_completed} Blok
                  </span>
                  <span className="text-[0.65rem] font-bold text-slate-400">
                    +{c.total_points} P
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function LiveRoomsClient({
  viewer,
  initialRoomSlug = null,
}: {
  viewer: RoomViewer | null;
  initialRoomSlug?: string | null;
}) {
  const [joinedSlug, setJoinedSlug] = useState<string | null>(() => {
    if (initialRoomSlug && getRoomBySlug(initialRoomSlug)) {
      return initialRoomSlug;
    }
    return null;
  });

  // Restore active room from localStorage on mount if not specified in URL
  useEffect(() => {
    if (initialRoomSlug && getRoomBySlug(initialRoomSlug)) {
      setJoinedSlug(initialRoomSlug);
      try {
        localStorage.setItem(ACTIVE_ROOM_STORAGE_KEY, initialRoomSlug);
      } catch {
        // Ignore
      }
      return;
    }

    try {
      const saved = localStorage.getItem(ACTIVE_ROOM_STORAGE_KEY);
      if (saved && getRoomBySlug(saved)) {
        setJoinedSlug(saved);
      }
    } catch {
      // Ignore
    }
  }, [initialRoomSlug]);

  const handleJoinRoom = (slug: string) => {
    triggerHaptic("medium");
    setJoinedSlug(slug);
    try {
      localStorage.setItem(ACTIVE_ROOM_STORAGE_KEY, slug);
    } catch {
      // Ignore
    }
    trackEvent("focus_room_joined", { slug });
  };

  const handleLeaveRoom = () => {
    setJoinedSlug(null);
    try {
      localStorage.removeItem(ACTIVE_ROOM_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  // Fallback guest viewer so even signed-out visitors can test & join focus rooms without error
  const activeViewer: RoomViewer = useMemo(
    () =>
      viewer ?? {
        id: "guest-viewer",
        name: "Misafir Öğrenci",
        avatarUrl: null,
      },
    [viewer],
  );

  const slugs = useMemo(() => FOCUS_ROOMS.map((room) => room.slug), []);
  // Only run observer count probes when viewing the room list (not while inside a room)
  const counts = useFocusRoomCounts(slugs, joinedSlug === null);

  const joinedRoom = joinedSlug ? getRoomBySlug(joinedSlug) : undefined;

  if (joinedRoom && joinedSlug) {
    return (
      <div className="space-y-4">
        {!viewer && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900">
            <span>💡 Kazandığın odak puanlarının hesabına kaydedilmesi için giriş yapabilirsin.</span>
            <Link
              href={`/auth?next=${encodeURIComponent(`/rooms?room=${joinedSlug}`)}`}
              className="tap-scale shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 shadow-2xs"
            >
              Giriş Yap
            </Link>
          </div>
        )}
        <SyncedPomodoroPanel
          slug={joinedSlug}
          roomName={joinedRoom.name}
          roomDescription={joinedRoom.description}
          viewer={activeViewer}
          onSelectRoom={handleJoinRoom}
          onLeaveRoom={handleLeaveRoom}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Aktif Odalar ({FOCUS_ROOMS.length})
        </h3>
        <Link
          href="/focus"
          className="text-xs font-black text-indigo-600 hover:underline"
        >
          🍅 Kişisel Pomodoro Sayacı ➔
        </Link>
      </div>
      {FOCUS_ROOMS.map((room) => {
        const liveCount = counts[room.slug] ?? 0;
        return (
          <div
            key={room.slug}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-night text-base">{room.name}</h4>
                {liveCount > 0 ? (
                  <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-black text-rose-600">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                    CANLI · {liveCount} kişi
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    7/24 Açık
                  </span>
                )}
              </div>
              <p className="mt-1 max-w-md text-sm font-medium text-slate-500">{room.description}</p>
            </div>
            <button
              type="button"
              onClick={() => handleJoinRoom(room.slug)}
              className="tap-scale w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-black text-white shadow-sm transition hover:brightness-105 sm:w-auto sm:px-6"
            >
              Odaya Katıl 🚀
            </button>
          </div>
        );
      })}
    </div>
  );
}
