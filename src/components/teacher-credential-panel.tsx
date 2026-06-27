"use client";

import { useRef, useState } from "react";

export function TeacherCredentialPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [credentialType, setCredentialType] = useState<"diploma" | "e_devlet">("diploma");
  const [documentUrl, setDocumentUrl] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitUrl() {
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
        return;
      }
      setMessage("Belge inceleme kuyruğuna alındı. Onay sonrası 'Diploması Onaylı' rozeti görünür.");
      setDocumentUrl("");
    } catch {
      setMessage("Bağlantı hatası.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(file: File) {
    setBusy(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("credentialType", credentialType);
      const response = await fetch("/api/trust/credential/upload", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(payload?.error ?? "Yükleme başarısız.");
        return;
      }
      setMessage("Dosya yüklendi ve admin onay kuyruğuna alındı.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setMessage("Bağlantı hatası.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Dijital Kimlik</p>
      <h3 className="mt-1 text-base font-black text-night">Diploma / Sertifika Yükle</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        PDF veya görsel yükleyin. Admin onayından sonra profilinizde &ldquo;Diploması Onaylı&rdquo; rozeti belirir.
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
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">Dosya yükle (PDF, JPG, PNG)</span>
          <input
            accept=".pdf,image/jpeg,image/png,image/webp"
            className="mt-1 block w-full text-sm"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadFile(file);
            }}
            ref={fileInputRef}
            type="file"
          />
        </label>
        <input
          className="zigo-input w-full rounded-xl px-3 py-2 text-sm font-semibold"
          onChange={(event) => setDocumentUrl(event.target.value)}
          placeholder="Alternatif: belge URL (PDF)"
          type="url"
          value={documentUrl}
        />
      </div>
      <button
        className="tap-scale mt-3 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
        disabled={busy || documentUrl.trim().length < 8}
        onClick={() => void submitUrl()}
        type="button"
      >
        {busy ? "İşleniyor…" : "URL ile gönder"}
      </button>
      {message ? <p className="mt-2 text-sm font-bold text-slate-600">{message}</p> : null}
    </section>
  );
}
