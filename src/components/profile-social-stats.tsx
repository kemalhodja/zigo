"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FollowButton } from "@/components/follow-button";
import { SocialAvatar, VerifiedBadge } from "@/components/social-primitives";

export type FollowUserItem = {
  id: string;
  fullName: string;
  handle: string;
  avatarUrl: string | null;
  role: string;
  isVerified: boolean;
  bio: string | null;
  isFollowing: boolean;
};

type ProfileSocialStatsProps = {
  targetUserId?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  postsLabel?: string;
  followersLabel?: string;
  followingLabel?: string;
  viewerId?: string | null;
};

export function ProfileSocialStats({
  targetUserId,
  postsCount,
  followersCount,
  followingCount,
  postsLabel = "Gönderi",
  followersLabel = "Takipçi",
  followingLabel = "Takip Edilen",
  viewerId,
}: ProfileSocialStatsProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"followers" | "following">("followers");
  const [users, setUsers] = useState<FollowUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  function openModal(tab: "followers" | "following") {
    if (!targetUserId) return;
    setActiveTab(tab);
    setModalOpen(true);
    setSearchQuery("");
    setError("");
  }

  useEffect(() => {
    if (!modalOpen || !targetUserId) return;

    let mounted = true;
    setLoading(true);
    setError("");

    fetch(`/api/social/follows?targetUserId=${encodeURIComponent(targetUserId)}&type=${activeTab}`)
      .then((res) => res.json())
      .then((payload: { data?: FollowUserItem[]; error?: string }) => {
        if (!mounted) return;
        if (payload.error) {
          setError(payload.error);
          setUsers([]);
        } else {
          setUsers(payload.data ?? []);
        }
      })
      .catch(() => {
        if (mounted) setError("Listeyi yüklerken hata oluştu.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [modalOpen, activeTab, targetUserId]);

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.handle.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      <div className="grid flex-1 grid-cols-3 gap-2 text-center">
        <div className="rounded-xl px-1 py-2 transition">
          <p className="text-lg font-black text-night">{postsCount.toLocaleString()}</p>
          <p className="text-[0.72rem] font-semibold text-slate-700">{postsLabel}</p>
        </div>

        <button
          type="button"
          onClick={() => openModal("followers")}
          className="tap-scale group rounded-xl px-1 py-2 transition hover:bg-slate-100/70"
        >
          <p className="text-lg font-black text-night group-hover:text-crystal">{followersCount.toLocaleString()}</p>
          <p className="text-[0.72rem] font-semibold text-slate-700 group-hover:text-night">{followersLabel}</p>
        </button>

        <button
          type="button"
          onClick={() => openModal("following")}
          className="tap-scale group rounded-xl px-1 py-2 transition hover:bg-slate-100/70"
        >
          <p className="text-lg font-black text-night group-hover:text-crystal">{followingCount.toLocaleString()}</p>
          <p className="text-[0.72rem] font-semibold text-slate-700 group-hover:text-night">{followingLabel}</p>
        </button>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("followers")}
                  className={`text-sm font-black transition ${
                    activeTab === "followers" ? "text-night underline decoration-crystal decoration-2 underline-offset-4" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {followersLabel} ({followersCount.toLocaleString()})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("following")}
                  className={`text-sm font-black transition ${
                    activeTab === "following" ? "text-night underline decoration-crystal decoration-2 underline-offset-4" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {followingLabel} ({followingCount.toLocaleString()})
                </button>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex size-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-night"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="border-b border-slate-100 px-4 py-2.5">
              <input
                type="text"
                placeholder="Kişilerde ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:bg-slate-200/60"
              />
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center gap-3 animate-pulse">
                      <div className="size-10 rounded-full bg-slate-200" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-28 rounded-md bg-slate-200" />
                        <div className="h-2.5 w-20 rounded-md bg-slate-150" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <p className="rounded-xl bg-rose-50 p-4 text-center text-xs font-bold text-rose-600">{error}</p>
              ) : filteredUsers.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-2xl">👥</p>
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    {searchQuery
                      ? "Aramanıza uygun kişi bulunamadı."
                      : activeTab === "followers"
                        ? "Henüz takipçi yok."
                        : "Henüz kimse takip edilmiyor."}
                  </p>
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 rounded-xl p-2 transition hover:bg-slate-50"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setModalOpen(false);
                        router.push(`/profile/${u.id}`);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <SocialAvatar className="size-10" label={u.fullName} imageUrl={u.avatarUrl} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-black text-night">{u.fullName}</p>
                          {u.isVerified ? <VerifiedBadge className="size-3.5" /> : null}
                        </div>
                        <p className="truncate text-xs font-semibold text-slate-500">@{u.handle}</p>
                      </div>
                    </button>

                    {viewerId && viewerId !== u.id ? (
                      <FollowButton
                        followingId={u.id}
                        initialFollowing={u.isFollowing}
                        showCount={false}
                      />
                    ) : (
                      <Link
                        href={`/profile/${u.id}`}
                        onClick={() => setModalOpen(false)}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                      >
                        Profil
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
