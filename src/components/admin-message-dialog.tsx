"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminMessageDialog({
  userId,
  userName,
  onClose,
}: {
  userId: string;
  userName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    try {
      const res = await fetch("/api/admin/users/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title, body }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Mesaj gönderilemedi");
      }

      setStatus("success");
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 1500);
    } catch (error) {
      setStatus("error");
      setErrorMsg(error instanceof Error ? error.message : "Mesaj gönderilemedi");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-night">Mesaj Gönder</h3>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>
        
        <p className="mb-4 text-sm font-bold text-slate-600">
          Alıcı: <span className="text-crystal">{userName}</span>
        </p>

        {status === "success" ? (
          <div className="rounded-xl bg-emerald-50 p-4 text-center">
            <p className="font-black text-emerald-600">Mesaj başarıyla gönderildi!</p>
          </div>
        ) : (
          <form onSubmit={sendMessage} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-black uppercase text-slate-500">Konu</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold focus:border-crystal focus:outline-none focus:ring-1 focus:ring-crystal"
                placeholder="Örn: Hesap Kısıtlaması Hakkında"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black uppercase text-slate-500">Mesaj</label>
              <textarea
                required
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm font-bold focus:border-crystal focus:outline-none focus:ring-1 focus:ring-crystal"
                placeholder="Mesajınızı buraya yazın..."
              />
            </div>

            {status === "error" && (
              <p className="text-xs font-bold text-red-600">{errorMsg}</p>
            )}

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
                disabled={status === "sending"}
                className="flex-1 rounded-xl bg-crystal p-3 text-sm font-black text-white disabled:opacity-50"
              >
                {status === "sending" ? "Gönderiliyor..." : "Gönder"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
