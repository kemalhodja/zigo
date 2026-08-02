"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminBroadcastDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [targetRole, setTargetRole] = useState<"all" | "student" | "teacher" | "parent">("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [sentCount, setSentCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function sendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole, title, body }),
      });

      const payload = (await res.json().catch(() => null)) as {
        error?: string;
        data?: { sentCount: number };
      } | null;

      if (!res.ok || !payload?.data) {
        throw new Error(payload?.error || "Toplu duyuru gönderilemedi.");
      }

      setStatus("success");
      setSentCount(payload.data.sentCount);
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Duyuru gönderilemedi.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-black text-night">📣 Genel Sistem Duyurusu Yayınla</h3>
            <p className="text-xs font-semibold text-slate-500">Seçilen kitledeki tüm kullanıcılara bildirim iletir.</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-full bg-slate-100 p-2 text-xs font-bold text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        {status === "success" ? (
          <div className="rounded-xl bg-emerald-50 p-6 text-center space-y-2">
            <p className="text-lg font-black text-emerald-700">Duyuru Yayınlandı! 🎉</p>
            <p className="text-sm font-bold text-emerald-600">
              Toplam <span className="underline">{sentCount}</span> kullanıcıya sistem bildirimi gönderildi.
            </p>
          </div>
        ) : (
          <form onSubmit={sendBroadcast} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-600">
                Hedef Kitle
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as "all" | "student" | "teacher" | "parent")}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold focus:border-crystal focus:outline-none"
              >
                <option value="all">👥 Tüm Kullanıcılar (Öğrenci, Öğretmen, Veli)</option>
                <option value="student">🎓 Sadece Öğrenciler</option>
                <option value="teacher">📚 Sadece Öğretmenler</option>
                <option value="parent">👨‍👩‍👧 Sadece Veliler</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-600">
                Duyuru Başlığı
              </label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Yeni Sınav Dönemi Güncellemesi Yayınlandı!"
                className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold focus:border-crystal focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-600">
                Duyuru Mesajı
              </label>
              <textarea
                required
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Duyuru detaylarını buraya yazın..."
                className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm font-bold focus:border-crystal focus:outline-none"
              />
            </div>

            {status === "error" ? (
              <p className="rounded-lg bg-rose-50 p-3 text-xs font-bold text-rose-600">{errorMsg}</p>
            ) : null}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-slate-100 p-3 text-sm font-black text-slate-600 hover:bg-slate-200"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={status === "sending" || !title.trim() || !body.trim()}
                className="flex-1 rounded-xl bg-crystal p-3 text-sm font-black text-white disabled:opacity-50"
              >
                {status === "sending" ? "Gönderiliyor…" : "Toplu Yayınla"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
