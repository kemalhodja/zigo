"use client";

import { useState } from "react";

export function ProfileFeedbackBox() {
  const [category, setCategory] = useState<"request" | "complaint">("request");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending" || !subject.trim() || content.trim().length < 10) return;

    setStatus("sending");
    setMessage("");

    try {
      const res = await fetch("/api/profile/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject, content }),
      });

      const payload = (await res.json().catch(() => null)) as {
        error?: string;
        data?: { message: string };
      } | null;

      if (!res.ok || !payload?.data) {
        throw new Error(payload?.error || "İletim başarısız.");
      }

      setStatus("success");
      setMessage(payload.data.message);
      setSubject("");
      setContent("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "İletim sırasında hata oluştu.");
    }
  }

  return (
    <section className="-mx-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-black text-night flex items-center gap-1.5">
            <span>📮</span>
            <span>İstek & Şikâyet Kutusu</span>
          </h3>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Platformu geliştirmemiz için görüş, öneri ve şikâyetlerinizi doğrudan yönetime iletin.
          </p>
        </div>
      </div>

      {status === "success" ? (
        <div className="rounded-xl bg-emerald-50 p-4 text-center space-y-2">
          <p className="text-sm font-black text-emerald-700">Geri Bildiriminiz Alındı! 🎉</p>
          <p className="text-xs font-semibold text-emerald-600">{message}</p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-2 text-xs font-bold text-emerald-800 underline"
          >
            Yeni bir mesaj yaz
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCategory("request")}
              className={`rounded-xl px-3 py-2.5 text-xs font-black transition ${
                category === "request"
                  ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              💡 İstek / Öneri
            </button>
            <button
              type="button"
              onClick={() => setCategory("complaint")}
              className={`rounded-xl px-3 py-2.5 text-xs font-black transition ${
                category === "complaint"
                  ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-300"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              ⚠️ Şikâyet / Hata
            </button>
          </div>

          <div>
            <label htmlFor="feedback-subject" className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-600">
              Konu Başlığı
            </label>
            <input
              id="feedback-subject"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={category === "request" ? "Örn: Profil sayfasına yeni rozet eklensin" : "Örn: Soru çözerken buton yanıt vermiyor"}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold outline-none focus:border-crystal focus:ring-1 focus:ring-crystal"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="feedback-content" className="text-xs font-black uppercase tracking-wider text-slate-600">
                Detaylı Açıklama
              </label>
              <span className="text-[10px] font-bold text-slate-400">{content.length} / 1500</span>
            </div>
            <textarea
              id="feedback-content"
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1500}
              placeholder="Düşüncelerinizi, yaşadığınız sorunu veya önerilerinizi detaylıca belirtin…"
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold outline-none focus:border-crystal focus:ring-1 focus:ring-crystal"
            />
          </div>

          {status === "error" ? (
            <p className="rounded-lg bg-rose-50 p-3 text-xs font-bold text-rose-600">{message}</p>
          ) : null}

          <button
            type="submit"
            disabled={status === "sending" || !subject.trim() || content.trim().length < 10}
            className="w-full rounded-xl bg-night py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {status === "sending" ? "Gönderiliyor…" : "Yönetime Gönder"}
          </button>
        </form>
      )}
    </section>
  );
}
