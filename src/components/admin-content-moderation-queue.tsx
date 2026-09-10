"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ContentItem = {
  id: string;
  type: "post" | "story" | "reel";
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  mediaUrl?: string | null;
  aiFlagged: boolean;
  aiFlagReason?: string | null;
  moderationPriority: "low" | "normal" | "high" | "critical";
  reportCount: number;
  createdAt: string;
  isVisible: boolean;
};

type AdminContentModerationQueueProps = {
  items: ContentItem[];
};

const PRIORITY_BADGE: Record<string, { label: string; cls: string }> = {
  critical: { label: "KRİTİK", cls: "bg-rose-600 text-white" },
  high: { label: "Yüksek", cls: "bg-rose-50 text-rose-700" },
  normal: { label: "Normal", cls: "bg-slate-100 text-slate-600" },
  low: { label: "Düşük", cls: "bg-slate-50 text-slate-400" },
};

const TYPE_LABELS: Record<string, string> = {
  post: "📝 Gönderi",
  story: "📖 Hikaye",
  reel: "🎬 Reel",
};

export function AdminContentModerationQueue({ items }: AdminContentModerationQueueProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "ai_flagged" | "reported" | "critical">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filtered = items.filter((item) => {
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (filter === "ai_flagged") return item.aiFlagged;
    if (filter === "reported") return item.reportCount > 0;
    if (filter === "critical") return item.moderationPriority === "critical";
    return true;
  });

  const sortedItems = [...filtered].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    const pa = priorityOrder[a.moderationPriority] ?? 2;
    const pb = priorityOrder[b.moderationPriority] ?? 2;
    if (pa !== pb) return pa - pb;
    if (b.aiFlagged !== a.aiFlagged) return b.aiFlagged ? 1 : -1;
    return b.reportCount - a.reportCount;
  });

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(sortedItems.map((i) => i.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function bulkAction(action: "bulk_approve" | "bulk_hide" | "bulk_escalate") {
    if (selectedIds.size === 0 || actionLoading) return;
    setActionLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/content-moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          contentIds: Array.from(selectedIds),
          contentType: "post",
          note: note || null,
        }),
      });

      const data = (await res.json().catch(() => null)) as { error?: string; data?: { affectedCount: number } } | null;
      if (!res.ok) throw new Error(data?.error ?? "İşlem başarısız.");

      setMessage(`✅ ${data?.data?.affectedCount ?? selectedIds.size} içerik işlendi.`);
      setSelectedIds(new Set());
      setNote("");
      router.refresh();
    } catch (err) {
      setMessage(`❌ ${err instanceof Error ? err.message : "Hata oluştu."}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function singleAction(
    item: ContentItem,
    action: "approved" | "hidden" | "escalated",
  ) {
    if (processingId) return;
    setProcessingId(item.id);
    setMessage("");

    try {
      const res = await fetch("/api/admin/content-moderation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: item.id,
          contentType: item.type,
          decision: action,
        }),
      });

      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "İşlem başarısız.");

      router.refresh();
    } catch (err) {
      setMessage(`❌ ${err instanceof Error ? err.message : "Hata oluştu."}`);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <section className="-mx-4 bg-white">
      {/* Header */}
      <div className="border-b border-slate-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-night">📚 İçerik Moderasyon Kuyruğu</h3>
            <p className="mt-1 text-xs font-bold text-slate-500">
              AI bayraklar, şikayet edilen içerikler, toplu onay/gizleme
            </p>
          </div>
          <Link
            href="/moderation"
            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-night hover:bg-slate-200 transition-colors"
          >
            Tam Moderasyon →
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 pb-3 pt-3">
        {[
          { id: "all", label: `Tümü (${items.length})` },
          { id: "critical", label: `🔴 Kritik (${items.filter((i) => i.moderationPriority === "critical").length})` },
          { id: "ai_flagged", label: `🤖 AI Bayrak (${items.filter((i) => i.aiFlagged).length})` },
          { id: "reported", label: `🚨 Şikayet (${items.filter((i) => i.reportCount > 0).length})` },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id as typeof filter)}
            className={`rounded-xl px-3 py-2 text-xs font-black transition-all ${
              filter === f.id
                ? "bg-crystal text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold focus:border-crystal focus:outline-none"
        >
          <option value="all">Tüm Türler</option>
          <option value="post">Gönderi</option>
          <option value="story">Hikaye</option>
          <option value="reel">Reel</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="border-b border-slate-100 bg-crystal/5 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black text-crystal">{selectedIds.size} içerik seçildi</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Moderatör notu (isteğe bağlı)"
              className="flex-1 min-w-[160px] rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold focus:border-crystal focus:outline-none"
            />
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void bulkAction("bulk_approve")}
              className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              ✅ Toplu Onayla
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void bulkAction("bulk_hide")}
              className="rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-black text-white hover:bg-rose-600 disabled:opacity-50"
            >
              🙈 Toplu Gizle
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void bulkAction("bulk_escalate")}
              className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-black text-white hover:bg-amber-600 disabled:opacity-50"
            >
              🚨 Eskalasyon
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500 hover:bg-slate-200"
            >
              ✕ İptal
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className={`mx-4 mt-3 rounded-lg p-3 text-xs font-bold ${message.startsWith("✅") ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {message}
        </div>
      )}

      {/* Select All */}
      {sortedItems.length > 0 && (
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-[0.65rem] font-black text-crystal hover:underline"
          >
            Tümünü Seç ({sortedItems.length})
          </button>
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="text-[0.65rem] font-black text-slate-400 hover:underline"
            >
              Seçimi Kaldır
            </button>
          )}
        </div>
      )}

      {/* Item List */}
      <div className="divide-y divide-slate-100">
        {sortedItems.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-2xl">✅</p>
            <p className="mt-2 text-sm font-black text-emerald-700">Bekleyen içerik yok!</p>
            <p className="mt-1 text-xs font-bold text-slate-500">Tüm içerikler incelenmiş durumda.</p>
          </div>
        ) : (
          sortedItems.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const priorityBadge = PRIORITY_BADGE[item.moderationPriority] ?? PRIORITY_BADGE.normal;
            const isProcessing = processingId === item.id;

            return (
              <article
                key={item.id}
                className={`px-4 py-4 transition-all ${isSelected ? "bg-crystal/5" : ""} ${
                  item.moderationPriority === "critical" ? "border-l-4 border-rose-500" :
                  item.aiFlagged ? "border-l-4 border-amber-400" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleSelect(item.id)}
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-crystal bg-crystal text-white"
                        : "border-slate-300 hover:border-crystal"
                    }`}
                  >
                    {isSelected && (
                      <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* Badges Row */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className="text-xs font-bold text-slate-500">{TYPE_LABELS[item.type]}</span>
                      <span className={`rounded-lg px-2 py-0.5 text-[0.65rem] font-black ${priorityBadge.cls}`}>
                        {priorityBadge.label}
                      </span>
                      {item.aiFlagged && (
                        <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[0.65rem] font-black text-amber-700">
                          🤖 AI Bayrak
                        </span>
                      )}
                      {item.reportCount > 0 && (
                        <span className="rounded-lg bg-rose-50 px-2 py-0.5 text-[0.65rem] font-black text-rose-700">
                          🚨 {item.reportCount} şikayet
                        </span>
                      )}
                      {!item.isVisible && (
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[0.65rem] font-black text-slate-500">
                          👁‍🗨 Gizli
                        </span>
                      )}
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <Link
                        href={`/admin/users/${item.authorId}`}
                        className="text-xs font-black text-crystal hover:underline"
                      >
                        {item.authorName}
                      </Link>
                      <span className="text-[0.65rem] font-bold text-slate-400">
                        · {item.authorRole} · {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                      </span>
                    </div>

                    {/* Content */}
                    <p className="line-clamp-3 text-sm leading-6 text-slate-700">{item.content}</p>

                    {item.aiFlagReason && (
                      <p className="mt-1 text-[0.65rem] font-bold text-amber-700">
                        AI Sebep: {item.aiFlagReason}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => void singleAction(item, "approved")}
                        className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                      >
                        ✅ Onayla
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => void singleAction(item, "hidden")}
                        className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition-colors"
                      >
                        🙈 Gizle
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => void singleAction(item, "escalated")}
                        className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                      >
                        🚨 Eskalasyon
                      </button>
                      <Link
                        href={`/admin/users/${item.authorId}`}
                        className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        👤 Kullanıcı →
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
