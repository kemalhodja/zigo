"use client";

import { useEffect, useState } from "react";

interface LimitSettingsCardProps {
  childId: string;
  childName: string;
}

interface GameSettings {
  daily_limit_minutes: number;
  night_ban_enabled: boolean;
  night_ban_start: string;
  night_ban_end: string;
}

export function LimitSettingsCard({ childId, childName }: LimitSettingsCardProps) {
  const [settings, setSettings] = useState<GameSettings>({
    daily_limit_minutes: 60,
    night_ban_enabled: true,
    night_ban_start: "22:00",
    night_ban_end: "08:00",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/parent/game-settings?childProfileId=${childId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setSettings(res.data);
      })
      .catch(() => {});
  }, [childId]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/parent/game-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childProfileId: childId,
          dailyLimitMinutes: settings.daily_limit_minutes,
          nightBanEnabled: settings.night_ban_enabled,
          nightBanStart: settings.night_ban_start,
          nightBanEnd: settings.night_ban_end,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Kaydedemedik, tekrar dene.");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {
      setError("Bağlantı hatası. İnternet bağlantını kontrol et.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-purple-50/60 p-4 space-y-5">
      <h3 className="text-sm font-black text-indigo-900">
        🎮 {childName} İçin Oyun Sınırları
      </h3>

      {/* Günlük oyun süresi */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-bold text-slate-600">
            Günlük Oyun Süresi
          </label>
          <span className="text-xs font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-lg">
            {settings.daily_limit_minutes} dk
          </span>
        </div>
        <input
          type="range"
          min="15"
          max="120"
          step="15"
          value={settings.daily_limit_minutes}
          onChange={(e) =>
            setSettings((s) => ({ ...s, daily_limit_minutes: Number(e.target.value) }))
          }
          className="w-full accent-indigo-600"
        />
        <div className="flex justify-between text-[0.6rem] font-bold text-slate-400 mt-0.5">
          <span>15 dk</span>
          <span>Maks 2 saat (120 dk)</span>
        </div>
      </div>

      {/* Gece yasağı toggle */}
      <div className="flex items-center justify-between py-2 border-t border-indigo-100">
        <div>
          <p className="text-xs font-bold text-slate-700">Gece Yasağı</p>
          <p className="text-[0.65rem] font-semibold text-slate-400">
            Belirtilen saatler arasında oyunları kapat
          </p>
        </div>
        <button
          onClick={() => setSettings((s) => ({ ...s, night_ban_enabled: !s.night_ban_enabled }))}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            settings.night_ban_enabled ? "bg-indigo-600" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-0.5 size-5 bg-white rounded-full shadow transition-transform ${
              settings.night_ban_enabled ? "left-6" : "left-0.5"
            }`}
          />
        </button>
      </div>

      {/* Gece saatleri */}
      {settings.night_ban_enabled && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[0.65rem] font-bold text-slate-500 block mb-1">Başlangıç</label>
            <input
              type="time"
              value={settings.night_ban_start}
              onChange={(e) => setSettings((s) => ({ ...s, night_ban_start: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[0.65rem] font-bold text-slate-500 block mb-1">Bitiş</label>
            <input
              type="time"
              value={settings.night_ban_end}
              onChange={(e) => setSettings((s) => ({ ...s, night_ban_end: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:border-indigo-400 focus:outline-none"
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs font-bold text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-black text-sm text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm shadow-indigo-200"
      >
        {isSaving ? "Kaydediliyor..." : saved ? "Kaydedildi ✅" : "Ayarları Kaydet"}
      </button>
    </div>
  );
}
