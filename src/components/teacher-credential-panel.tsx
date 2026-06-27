"use client";

import { useState } from "react";

export function TeacherCredentialPanel() {
  const [credentialType, setCredentialType] = useState<"diploma" | "e_devlet">("diploma");
  const [documentUrl, setDocumentUrl] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/trust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_credential",
          credentialType,
          documentUrl,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(payload?.error ?? "Gönderilemedi.");
        setBusy(false);
        return;
      }
      setMessage("Belge inceleme kuyruğuna alındı. Onaylı Öğretmen rozeti admin onayından sonra görünür.");
      setDocumentUrl("");
      setBusy(false);
    } catch {
      setMessage("Bağlantı hatası.");
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Onaylı Öğretmen</p>
      <h3 className="mt-1 text-base font-black text-night">Diploma veya e-Devlet doğrulaması</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Velilerin güvenini kazanmak için diploma PDF linki veya e-Devlet doğrulama belgesi yükleyin.
      </p>
      <div className="mt-3 space-y-2">
        <select
          className="zigo-input w-full rounded-xl px-3 py-2 text-sm font-semibold"
          onChange={(event) => setCredentialType(event.target.value as "diploma" | "e_devlet")}
          value={credentialType}
        >
          <option value="diploma">Diploma / mezuniyet belgesi</option>
          <option value="e_devlet">e-Devlet doğrulama</option>
        </select>
        <input
          className="zigo-input w-full rounded-xl px-3 py-2 text-sm font-semibold"
          onChange={(event) => setDocumentUrl(event.target.value)}
          placeholder="Belge URL (PDF veya güvenli link)"
          type="url"
          value={documentUrl}
        />
      </div>
      <button
        className="tap-scale mt-3 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
        disabled={busy || documentUrl.trim().length < 8}
        onClick={() => void submit()}
        type="button"
      >
        {busy ? "Gönderiliyor…" : "Doğrulama belgesi gönder"}
      </button>
      {message ? <p className="mt-2 text-sm font-bold text-slate-600">{message}</p> : null}
    </section>
  );
}
