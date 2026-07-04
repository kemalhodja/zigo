"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type AwardKind = "micro_video_watched" | "mini_quiz_completed" | "duel_won";

type ChildRewardPanelProps = {
  childProfileId: string;
};

export function ChildRewardPanel({ childProfileId }: ChildRewardPanelProps) {
  const { childPanels: c, avatarPage: a, actions: act } = useMessages();
  const router = useRouter();
  const [message, setMessage] = useState(c.confirmLearning);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const rewards = useMemo(
    () => [
      { kind: "micro_video_watched" as const, label: c.watchedVideo, points: "+10" },
      { kind: "mini_quiz_completed" as const, label: c.solvedQuiz, points: "+10" },
      { kind: "duel_won" as const, label: c.wonDuel, points: "+25" },
    ],
    [c],
  );

  const avatarItems = useMemo(
    () => [
      { key: "hat", value: "crystal_cap", label: a.crystalCap },
      { key: "suit", value: "science_hero", label: c.scienceHero },
      { key: "pet", value: "study_owl", label: a.studyOwl },
    ],
    [a, c],
  );

  async function award(kind: AwardKind) {
    if (pendingAction) return;
    setPendingAction(kind);

    try {
      const response = await fetch("/api/children/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childProfileId, kind }),
      });
      const payload = (await response.json().catch(() => null)) as { data?: { total_points?: number }; error?: string } | null;

      setMessage(
        response.ok
          ? c.learningConfirmed.replace("{points}", String(payload?.data?.total_points ?? "—"))
          : payload?.error ?? c.addPointsFailed,
      );
      if (response.ok) router.refresh();
    } catch {
      setMessage(act.connectionFailedTryAgain);
    } finally {
      setPendingAction(null);
    }
  }

  async function equip(key: string, value: string) {
    if (pendingAction) return;
    setPendingAction(value);

    try {
      const response = await fetch("/api/children/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childProfileId, assets: { [key]: value } }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      const label = itemLabel(value, avatarItems, c.avatarItem);

      setMessage(response.ok ? c.equippedItem.replace("{item}", label) : payload?.error ?? c.equipFailed);
      if (response.ok) router.refresh();
    } catch {
      setMessage(act.connectionFailedTryAgain);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-3 rounded-lg bg-violet-50 p-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{c.step3}</p>
        <p className="mt-1 text-sm font-black text-night">{c.parentConfirmed}</p>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{c.parentConfirmedDesc}</p>
      </div>

      <div className="grid gap-2">
        {rewards.map((reward) => (
          <button
            className="tap-scale flex items-center justify-between rounded-lg bg-white px-4 py-3 text-left disabled:opacity-60"
            disabled={Boolean(pendingAction)}
            key={reward.kind}
            onClick={() => award(reward.kind)}
            type="button"
          >
            <span className="text-sm font-bold text-slate-700">{reward.label}</span>
            <span className="rounded-lg bg-mint px-3 py-1 text-xs font-black text-night">
              {pendingAction === reward.kind ? c.adding : reward.points}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-2">
        {avatarItems.map((item) => (
          <button
            className="tap-scale flex items-center justify-between rounded-lg bg-white px-4 py-3 text-left disabled:opacity-60"
            disabled={Boolean(pendingAction)}
            key={item.value}
            onClick={() => equip(item.key, item.value)}
            type="button"
          >
            <span className="text-sm font-bold text-slate-700">{item.label}</span>
            <span className="text-xs font-black text-crystal">{pendingAction === item.value ? c.equipping : c.equip}</span>
          </button>
        ))}
      </div>

      <p className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-crystal">{message}</p>
    </div>
  );
}

function itemLabel(value: string, items: { value: string; label: string }[], fallback: string) {
  return items.find((item) => item.value === value)?.label ?? fallback;
}
