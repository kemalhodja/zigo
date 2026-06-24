"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";
import type { ChildProfileRow, StoreProductRow } from "@/lib/supabase/database.types";

type StoreProductCardProps = {
  product: StoreProductRow;
  mode: "student" | "parent";
  childrenProfiles?: ChildProfileRow[];
};

const categoryAccents: Record<StoreProductRow["category"], string> = {
  stationery: "from-sun to-peach",
  book: "from-aqua to-mint",
  question_bank: "from-crystal to-berry",
  digital_avatar: "from-berry to-peach",
  experience: "from-crystal to-aqua",
};

export function StoreProductCard({ product, mode, childrenProfiles = [] }: StoreProductCardProps) {
  const { store: st, actions: a } = useMessages();
  const categoryLabels = useMemo(
    () => ({
      stationery: st.stationery,
      book: st.books,
      question_bank: st.questionBank,
      digital_avatar: st.avatar,
      experience: st.experiences,
    }),
    [st],
  );
  const router = useRouter();
  const [selectedChildId, setSelectedChildId] = useState(childrenProfiles[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState(st.redeemDefault);

  const isOutOfStock = product.stock_count !== null && product.stock_count <= 0;
  const canRedeem = mode === "student" || selectedChildId.length > 0;
  const isRedeemed = status === "saved";

  async function redeem() {
    if (status === "saving") return;

    setStatus("saving");
    setMessage(st.creatingRequest);

    try {
      const response = await fetch("/api/store/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          childProfileId: mode === "parent" ? selectedChildId : undefined,
          note,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setStatus("error");
        setMessage(payload?.error ?? st.redeemFailed);
        return;
      }

      setStatus("saved");
      setMessage(mode === "parent" ? st.redeemParent : st.redeemStudent);
      router.refresh();
    } catch {
      setStatus("error");
      setMessage(a.connectionFailedTryAgain);
    }
  }

  return (
    <article className="-mx-4 space-y-4 border-b border-pink-100 bg-white px-4 py-4">
      <div className={`rounded-lg bg-gradient-to-br ${categoryAccents[product.category]} p-4 text-white`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="rounded-lg bg-white/20 px-3 py-1 text-xs font-black text-white backdrop-blur">
              {categoryLabels[product.category]}
            </span>
            <h3 className="mt-4 text-xl font-black">{product.name}</h3>
            <p className="mt-2 text-sm leading-6 text-white/82">{product.description}</p>
          </div>
          <div className="rounded-lg bg-black/20 px-4 py-3 text-center text-white backdrop-blur">
            <p className="text-2xl font-black">{product.price_points}</p>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/70">Zigo</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-lg bg-slate-100 px-3 py-1 text-slate-600">
          {product.stock_count === null ? st.unlimited : st.inStock.replace("{count}", String(product.stock_count))}
        </span>
        <span className={`rounded-lg px-3 py-1 ${product.requires_parent_approval ? "bg-violet-100 text-crystal" : "bg-emerald-50 text-emerald-700"}`}>
          {product.requires_parent_approval ? st.parentApprovalRequired : st.instantDigital}
        </span>
      </div>

      {product.requires_parent_approval ? (
        <p className="rounded-lg bg-violet-50 px-4 py-3 text-xs font-bold leading-5 text-crystal">
          {st.parentApprovalSafe}
        </p>
      ) : null}

      {mode === "parent" ? (
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            {st.childProfile}
          </span>
          <select
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-crystal focus:bg-white"
            onChange={(event) => setSelectedChildId(event.target.value)}
            value={selectedChildId}
          >
            {childrenProfiles.map((child) => (
              <option key={child.id} value={child.id}>
                {child.display_name} - {child.total_points} Zigo
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <input
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-crystal focus:bg-white"
        onChange={(event) => setNote(event.target.value)}
        placeholder={st.redeemNote}
        value={note}
      />

      <button
        className="tap-scale w-full zigo-cta tap-scale rounded-lg px-4 py-3 text-sm font-black text-white disabled:opacity-60"
        disabled={status === "saving" || isOutOfStock || !canRedeem || isRedeemed}
        onClick={redeem}
        type="button"
      >
        {status === "saving" ? st.redeeming : isRedeemed ? st.redeemed : isOutOfStock ? st.outOfStock : st.redeemWithZigo}
      </button>

      <p
        className={`rounded-lg px-4 py-3 text-sm font-bold ${
          status === "error" ? "bg-red-50 text-red-600" : status === "saved" ? "bg-emerald-50 text-emerald-600" : "bg-violet-50 text-crystal"
        }`}
      >
        {message}
      </p>
    </article>
  );
}
