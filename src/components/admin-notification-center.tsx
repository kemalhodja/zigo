"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Template = {
  key: string;
  label: string;
  title: string;
  body: string;
  emoji: string;
};

type HistoryItem = {
  id: string;
  title: string;
  body: string;
  target_role: string;
  status: string;
  sent_count: number;
  created_at: string;
  sent_at: string | null;
};

type AdminNotificationCenterProps = {
  templates: Template[];
  history: HistoryItem[];
};

const ROLE_OPTIONS = [
  { value: "all", label: "👥 Tüm Kullanıcılar" },
  { value: "student", label: "🎓 Öğrenciler" },
  { value: "teacher", label: "📚 Öğretmenler" },
  { value: "parent", label: "👨‍👩‍👧 Veliler" },
  { value: "education_institution", label: "🏫 Eğitim Kurumları" },
  { value: "education_platform", label: "💻 Platformlar" },
  { value: "publisher", label: "📖 Yayınevleri" },
];

const FILTER_OPTIONS = [
  { value: "all", label: "Tüm Kullanıcılar" },
  { value: "subscribed", label: "Sadece Aboneler" },
  { value: "trial", label: "Sadece Deneme Kullananlar" },
  { value: "expired", label: "Deneme / Aboneliği Bitenler" },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: "Bekliyor", cls: "bg-amber-50 text-amber-700" },
  sent: { label: "Gönderildi", cls: "bg-emerald-50 text-emerald-700" },
  failed: { label: "Başarısız", cls: "bg-rose-50 text-rose-700" },
  cancelled: { label: "İptal", cls: "bg-slate-100 text-slate-500" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminNotificationCenter({ templates, history }: AdminNotificationCenterProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"compose" | "history">("compose");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [targetRole, setTargetRole] = useState("all");
  const [targetFilter, setTargetFilter] = useState("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sendMode, setSendMode] = useState<"now" | "scheduled">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [sentCount, setSentCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  function applyTemplate(tpl: Template) {
    setSelectedTemplate(tpl.key);
    setTitle(tpl.title);
    setBody(tpl.body);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setErrorMsg("");

    try {
      const payload = {
        targetRole,
        targetFilter,
        title,
        body,
        scheduledAt: sendMode === "scheduled" && scheduledAt ? scheduledAt : null,
        templateKey: selectedTemplate || null,
      };

      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as {
        error?: string;
        data?: { sentCount: number };
      } | null;

      if (!res.ok || !data?.data) {
        throw new Error(data?.error ?? "Duyuru gönderilemedi.");
      }

      setStatus("success");
      setSentCount(data.data.sentCount);
      setTimeout(() => {
        setStatus("idle");
        setSentCount(null);
        setTitle("");
        setBody("");
        setSelectedTemplate("");
        router.refresh();
      }, 3000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Duyuru gönderilemedi.");
    }
  }

  return (
    <section className="-mx-4 bg-white">
      {/* Header */}
      <div className="border-b border-slate-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-night">🔔 Bildirim Merkezi</h3>
            <p className="mt-1 text-xs font-bold text-slate-500">
              Zamanlanmış ve anlık duyurular, segmentasyon ve şablon kütüphanesi
            </p>
          </div>
          <div className="flex gap-2">
            {(["compose", "history"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
                  tab === t
                    ? "bg-crystal text-white shadow-md"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {t === "compose" ? "✍️ Oluştur" : `📋 Geçmiş (${history.length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Compose Tab */}
      {tab === "compose" && (
        <div className="px-4 py-5">
          {status === "success" ? (
            <div className="rounded-2xl bg-emerald-50 p-8 text-center">
              <p className="text-3xl">🎉</p>
              <p className="mt-2 text-lg font-black text-emerald-700">Duyuru Gönderildi!</p>
              <p className="mt-1 text-sm font-bold text-emerald-600">
                Toplam <strong>{sentCount}</strong> kullanıcıya ulaştı.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-5">
              {/* Şablon Kütüphanesi */}
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-600">
                  📌 Hazır Şablonlar
                </p>
                <div className="flex flex-wrap gap-2">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.key}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                        selectedTemplate === tpl.key
                          ? "bg-crystal text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {tpl.emoji} {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hedef Kitle */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-600">
                    Hedef Rol
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold focus:border-crystal focus:outline-none"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-600">
                    Abonelik Filtresi
                  </label>
                  <select
                    value={targetFilter}
                    onChange={(e) => setTargetFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold focus:border-crystal focus:outline-none"
                  >
                    {FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Başlık */}
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-600">
                  Duyuru Başlığı
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  placeholder="Örn: Yeni Sınav Dönemi Güncellemesi Yayınlandı!"
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold focus:border-crystal focus:outline-none"
                />
              </div>

              {/* Mesaj */}
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-600">
                  Duyuru Metni
                </label>
                <textarea
                  required
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={1000}
                  placeholder="Duyuru detaylarını buraya yazın..."
                  className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm font-bold focus:border-crystal focus:outline-none"
                />
                <p className="mt-1 text-right text-[0.65rem] font-bold text-slate-400">
                  {body.length}/1000
                </p>
              </div>

              {/* Zamanlama */}
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-600">
                  ⏰ Gönderim Zamanı
                </p>
                <div className="flex gap-3">
                  {(["now", "scheduled"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSendMode(mode)}
                      className={`flex-1 rounded-xl py-2.5 text-xs font-black transition-all ${
                        sendMode === mode
                          ? "bg-night text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {mode === "now" ? "⚡ Hemen Gönder" : "📅 Zamanla"}
                    </button>
                  ))}
                </div>
                {sendMode === "scheduled" && (
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm font-bold focus:border-crystal focus:outline-none"
                  />
                )}
              </div>

              {status === "error" && (
                <p className="rounded-lg bg-rose-50 p-3 text-xs font-bold text-rose-600">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending" || !title.trim() || !body.trim()}
                className="w-full rounded-xl bg-gradient-to-r from-crystal to-indigo-500 p-4 text-sm font-black text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all hover:shadow-xl"
              >
                {status === "sending"
                  ? "Gönderiliyor…"
                  : sendMode === "now"
                    ? "📣 Toplu Duyuru Yayınla"
                    : "📅 Duyuruyu Zamanla"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* History Tab */}
      {tab === "history" && (
        <div className="divide-y divide-slate-100">
          {history.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-black text-night">Henüz duyuru geçmişi yok</p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                Oluştur sekmesinden ilk duyurunuzu gönderin.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.pending;
              return (
                <article key={item.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block rounded-lg px-2 py-0.5 text-[0.65rem] font-black ${badge.cls}`}>
                          {badge.label}
                        </span>
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[0.65rem] font-black text-slate-600">
                          {ROLE_OPTIONS.find((r) => r.value === item.target_role)?.label ?? item.target_role}
                        </span>
                      </div>
                      <p className="mt-1 font-black text-night truncate">{item.title}</p>
                      <p className="mt-0.5 text-xs font-bold text-slate-500 line-clamp-2">
                        {item.body}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {item.sent_count > 0 && (
                        <p className="text-lg font-black text-crystal">{item.sent_count}</p>
                      )}
                      <p className="text-[0.65rem] font-bold text-slate-400">
                        {item.sent_at ? formatDate(item.sent_at) : formatDate(item.created_at)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
