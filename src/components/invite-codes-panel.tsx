"use client";

import { useCallback, useEffect, useState } from "react";

type InvitePanelProps = {
  canCreate: boolean;
};

type InviteRow = {
  id: string;
  code: string;
  use_count: number;
  max_uses: number;
  is_active: boolean;
};

export function InviteCodesPanel({ canCreate }: InvitePanelProps) {
  const [codes, setCodes] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/invites");
      const payload = (await response.json().catch(() => null)) as { data?: InviteRow[]; error?: string } | null;
      if (!response.ok) {
        setCodes([]);
        setMessage(payload?.error ?? "Davet kodları yüklenemedi.");
        return;
      }
      setCodes(payload?.data ?? []);
      setMessage("");
    } catch {
      setMessage("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createCode() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/invites", { method: "POST" });
      const payload = (await response.json().catch(() => null)) as { data?: InviteRow; error?: string } | null;
      if (!response.ok) {
        setMessage(payload?.error ?? "Kod oluşturulamadı.");
        return;
      }
      await load();
      setMessage(payload?.data?.code ? `Kod: ${payload.data.code}` : "Kod oluşturuldu.");
    } catch {
      setMessage("Bağlantı hatası.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setMessage(`${code} kopyalandı.`);
    } catch {
      setMessage(code);
    }
  }

  if (!canCreate) return null;

  return (
    <section className="-mx-4 border border-slate-100 bg-white px-4 py-4">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-slate-500">Davet</p>
      <h2 className="mt-1 text-lg font-black text-night">Arkadaşlarını davet et</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">
        Kodunu paylaş; kayıt olan kullanıcılar eğitim ağına katılsın.
      </p>
      <button
        className="tap-scale zigo-cta mt-3 rounded-xl px-4 py-2.5 text-sm font-black text-white disabled:opacity-60"
        disabled={busy || loading}
        onClick={() => void createCode()}
        type="button"
      >
        Yeni davet kodu
      </button>
      {message ? <p className="mt-2 text-xs font-bold text-slate-600">{message}</p> : null}
      {loading ? <p className="mt-3 text-sm font-bold text-slate-500">Yükleniyor…</p> : null}
      <ul className="mt-3 space-y-2">
        {codes.map((row) => (
          <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2" key={row.id}>
            <div>
              <p className="font-black text-night">{row.code}</p>
              <p className="text-xs font-semibold text-slate-500">
                {row.use_count}/{row.max_uses} kullanım
              </p>
            </div>
            <button
              className="tap-scale rounded-lg bg-white px-3 py-2 text-xs font-black text-crystal"
              onClick={() => void copyCode(row.code)}
              type="button"
            >
              Kopyala
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
