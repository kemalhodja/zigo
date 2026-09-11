"use client";

import { useEffect, useMemo, useState } from "react";

import { useAudio } from "@/hooks/use-audio";
import { useFocusRoom, useFocusRoomCounts } from "@/hooks/use-focus-room";
import { trackEvent } from "@/lib/client/analytics";
import { triggerHaptic } from "@/lib/client/haptics";
import {
  FOCUS_ROOMS,
  formatCountdown,
  getRoomPhase,
  type RoomCompetitor,
  type RoomPhase,
} from "@/lib/domain/focus-rooms";

export type RoomViewer = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

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
          {name.slice(0, 2).toUpperCase()}
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
  viewer,
}: {
  slug: string;
  roomName: string;
  viewer: RoomViewer;
}) {
  const [phase, setPhase] = useState<RoomPhase>(() => getRoomPhase());
  const [completedBlocks, setCompletedBlocks] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`zigo:focus_room:${slug}:blocks`);
      return saved ? parseInt(saved, 10) || 0 : 0;
    }
    return 0;
  });
  const [leaderboard, setLeaderboard] = useState<RoomCompetitor[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const { playSound } = useAudio();

  const { participants, connected, leave } = useFocusRoom({
    slug,
    enabled: true,
    participant: { user_id: viewer.id, display_name: viewer.name, avatar_url: viewer.avatarUrl },
  });

  // Fetch leaderboard
  useEffect(() => {
    let isMounted = true;
    async function fetchLeaderboard() {
      try {
        const res = await fetch(`/api/rooms/leaderboard?slug=${slug}`);
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted && json.data?.competitors) {
          setLeaderboard(json.data.competitors);
        }
      } catch (err) {
        console.error("Liderlik tablosu alınamadı:", err);
      } finally {
        if (isMounted) setLoadingLeaderboard(false);
      }
    }
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [slug]);

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

        // Register block completion
        fetch("/api/rooms/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, blockIndex: currentBlock }),
        }).catch(console.error);

        setCompletedBlocks((prev) => {
          const next = prev + 1;
          if (typeof window !== "undefined") {
            localStorage.setItem(`zigo:focus_room:${slug}:blocks`, String(next));
          }
          return next;
        });
      }

      currentBlock = nextPhase.blockIndex;
      currentPhaseType = nextPhase.phase;
    }, 1000);
    return () => clearInterval(timer);
  }, [slug, playSound]);

  const progressPct = useMemo(() => {
    const total = phase.phase === "focus" ? 25 * 60 : 5 * 60;
    return Math.round(((total - phase.secondsRemaining) / total) * 100);
  }, [phase]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-400">
              {connected ? "● Canlı bağlantı" : "○ Bağlanıyor..."}
            </p>
            <h3 className="text-lg font-black text-night">{roomName}</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              leave();
              trackEvent("focus_room_left", { slug });
              window.location.reload();
            }}
            className="tap-scale rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50"
          >
            Odadan Çık
          </button>
        </div>

        <div className="mb-5 rounded-2xl bg-slate-900 p-6 text-center">
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
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full transition-all duration-1000 ${
                phase.phase === "focus" ? "bg-emerald-500" : "bg-amber-400"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[0.65rem] font-bold text-slate-400">
            <span>Senkronize 25/5 dk bloklar</span>
            <span className="text-amber-300 font-black">
              Senin Tamamladığın: {completedBlocks} Blok 🏆
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AvatarStack names={participants.map((p) => p.display_name)} />
            <span className="text-sm font-black text-slate-600">
              {participants.length} kişi çalışıyor
            </span>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-600">
            Her blok tamamlanınca +30 puan & sıralama yükselişi 🎉
          </span>
        </div>
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
            Bu hafta bu odada henüz tamamlanan blok yok. İlk sen tamamla!
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

export function LiveRoomsClient({ viewer }: { viewer: RoomViewer | null }) {
  const [joinedSlug, setJoinedSlug] = useState<string | null>(null);
  const slugs = useMemo(() => FOCUS_ROOMS.map((room) => room.slug), []);
  const counts = useFocusRoomCounts(slugs, viewer !== null);

  const joinedRoom = FOCUS_ROOMS.find((room) => room.slug === joinedSlug);

  if (!viewer) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="mb-4 text-sm font-bold text-slate-500">
          Odalara katılmak için giriş yapman gerekiyor.
        </p>
        <a
          href="/auth"
          className="tap-scale inline-block rounded-xl bg-crystal px-8 py-3 text-sm font-black text-white shadow-md transition hover:bg-crystal-dark"
        >
          Giriş Yap
        </a>
      </div>
    );
  }

  if (joinedRoom && joinedSlug) {
    return (
      <SyncedPomodoroPanel slug={joinedSlug} roomName={joinedRoom.name} viewer={viewer} />
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
        Aktif Odalar
      </h3>
      {FOCUS_ROOMS.map((room) => {
        const liveCount = counts[room.slug] ?? 0;
        return (
          <div
            key={room.slug}
            className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-night">{room.name}</h4>
                {liveCount > 0 ? (
                  <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-black text-rose-600">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                    CANLI · {liveCount}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                    boş
                  </span>
                )}
              </div>
              <p className="mt-1 max-w-md text-sm font-medium text-slate-500">{room.description}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setJoinedSlug(room.slug);
                trackEvent("focus_room_joined", { slug: room.slug });
              }}
              className="tap-scale w-full rounded-xl bg-crystal py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-crystal-dark sm:w-auto sm:px-6"
            >
              Odaya Katıl
            </button>
          </div>
        );
      })}
    </div>
  );
}
