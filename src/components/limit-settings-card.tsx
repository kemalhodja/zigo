"use client";

import { useState } from "react";

interface LimitSettingsCardProps {
  childId: string;
  childName: string;
}

export function LimitSettingsCard({ childId, childName }: LimitSettingsCardProps) {
  const [dailyPostLimit, setDailyPostLimit] = useState(5);
  const [dailyScreenTime, setDailyScreenTime] = useState(60); // minutes
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mt-3 rounded-xl border border-indigo-50 bg-indigo-50/50 p-4">
      <h3 className="mb-4 text-sm font-black text-indigo-900">
        {childName} İçin Sosyal Limitler
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-600">
            Günlük Maksimum Post Limiti: {dailyPostLimit} Gönderi
          </label>
          <input 
            type="range" 
            min="1" 
            max="15" 
            value={dailyPostLimit} 
            onChange={(e) => setDailyPostLimit(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-600">
            Günlük Ekran Süresi: {dailyScreenTime} Dakika
          </label>
          <input 
            type="range" 
            min="15" 
            max="240" 
            step="15"
            value={dailyScreenTime} 
            onChange={(e) => setDailyScreenTime(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
        </div>

        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSaving ? "Kaydediliyor..." : saved ? "Kaydedildi ✅" : "Limitleri Güncelle"}
        </button>
      </div>
    </div>
  );
}
