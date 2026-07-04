"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";
import type { AvatarAssets } from "@/lib/supabase/database.types";

type AvatarStoreProps = {
  equippedAssets: AvatarAssets;
  totalPoints: number;
};

export function AvatarStore({ equippedAssets, totalPoints }: AvatarStoreProps) {
  const { avatarStore: s, avatarPage: a, store, actions: act } = useMessages();

  const assets = useMemo(
    () => [
      { accent: "from-crystal to-berry", key: "hat" as const, value: "crystal_cap", label: a.crystalCap, price: 120 },
      { accent: "from-aqua to-mint", key: "suit" as const, value: "math_hero", label: a.mathHeroSuit, price: 240 },
      { accent: "from-sun to-peach", key: "pet" as const, value: "owl", label: a.studyOwl, price: 180 },
    ],
    [a],
  );

  const initialEquipped = useMemo(() => {
    const values = [equippedAssets.hat, equippedAssets.suit, equippedAssets.pet].filter(Boolean);
    return values[0] ?? null;
  }, [equippedAssets.hat, equippedAssets.pet, equippedAssets.suit]);

  const [message, setMessage] = useState(s.earnHint);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [equippedValue, setEquippedValue] = useState<string | null>(initialEquipped);

  async function equip(key: (typeof assets)[number]["key"], value: string, price: number) {
    if (pendingAction) return;

    const label = itemLabel(value, assets, s.avatarItem);

    if (totalPoints < price) {
      setMessage(s.needMorePoints.replace("{count}", String(price - totalPoints)).replace("{item}", label));
      return;
    }

    setPendingAction(value);

    try {
      const response = await fetch("/api/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assets: { [key]: value } }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMessage(payload?.error ?? s.equipFailed);
        return;
      }

      setEquippedValue(value);
      setMessage(s.equipped.replace("{item}", label));
    } catch {
      setMessage(act.connectionFailedTryAgain);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="-mx-4 border-y border-slate-100 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{s.studentMode}</p>
        <h2 className="mt-1 text-2xl font-black text-night">{s.avatarLocker}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{s.unlockDesc}</p>
        <div className="mt-4 rounded-lg bg-gradient-to-r from-crystal via-berry to-aqua p-4 text-white">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">{s.balance}</p>
          <p className="mt-1 text-2xl font-black">{totalPoints.toLocaleString()} {a.pointsLabel}</p>
        </div>
      </section>

      <section className="-mx-4 grid grid-cols-2 gap-2 bg-white px-4 py-4">
        <Link className="tap-scale rounded-lg bg-gradient-to-r from-crystal to-berry px-4 py-3 text-sm font-black text-white" href="/micro">
          {s.earnFromMicro}
        </Link>
        <Link className="tap-scale rounded-lg bg-gradient-to-r from-aqua to-mint px-4 py-3 text-sm font-black text-white" href="/learn">
          {s.takeQuizzes}
        </Link>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <h3 className="text-lg font-black text-night">{store.title}</h3>
        <div className="mt-3 grid gap-2">
          {assets.map((asset) => {
            const isUnlocked = totalPoints >= asset.price;
            const isEquipped = equippedValue === asset.value;

            return (
              <button
                className={`tap-scale flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left disabled:opacity-60 ${
                  isUnlocked ? "border-pink-100 bg-white" : "border-slate-100 bg-slate-50"
                }`}
                disabled={Boolean(pendingAction)}
                key={asset.value}
                onClick={() => equip(asset.key, asset.value, asset.price)}
                type="button"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex size-10 items-center justify-center rounded-lg bg-gradient-to-br ${asset.accent} text-sm font-black text-white ${
                      isUnlocked ? "" : "opacity-50"
                    }`}
                  >
                    {asset.label.slice(0, 1)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-slate-700">{asset.label}</span>
                    <span className="text-xs font-black text-crystal">
                      {isUnlocked
                        ? s.ptsUnlocked.replace("{price}", String(asset.price))
                        : s.ptsNeed.replace("{price}", String(asset.price)).replace("{remaining}", String(asset.price - totalPoints))}
                    </span>
                  </span>
                </span>
                <span
                  className={`rounded-lg px-3 py-1.5 text-sm font-black ${
                    isEquipped ? "bg-crystal text-white" : isUnlocked ? "bg-slate-100 text-night" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {pendingAction === asset.value ? s.equipping : isEquipped ? s.equippedLabel : isUnlocked ? a.equip : s.locked}
                </span>
              </button>
            );
          })}
        </div>
        <Link className="tap-scale mt-3 inline-flex text-xs font-black text-crystal" href="/store">
          {s.parentRewardsLink}
        </Link>
      </section>

      <p className="-mx-4 bg-white px-4 py-3 text-sm font-bold text-slate-600">{message}</p>
    </div>
  );
}

function itemLabel(value: string, items: { value: string; label: string }[], fallback: string) {
  return items.find((asset) => asset.value === value)?.label ?? fallback;
}
