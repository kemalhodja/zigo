"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import { displayEducationAreaName } from "@/lib/domain/education-catalog";
import { useSubscriptionStatus } from "@/lib/hooks/use-subscription-status";
import turkeyData from "@/lib/turkey-data.json";

type Area = { id: number; area_name: string; age_group: string | null };
type Child = { id: string; name: string };

const GRADE_LEVEL_OPTIONS = [
  "Okul Öncesi",
  "1. Sınıf",
  "2. Sınıf",
  "3. Sınıf",
  "4. Sınıf",
  "5. Sınıf",
  "6. Sınıf",
  "7. Sınıf",
  "8. Sınıf (LGS)",
  "9. Sınıf",
  "10. Sınıf",
  "11. Sınıf",
  "12. Sınıf (YKS / TYT / AYT)",
  "Mezun / Üniversiteye Hazırlık",
  "Yetişkin / Genel İlgi",
];

const DRAFT_STORAGE_KEY = "zigo_draft_private_lesson_post_v1";

export function CreatePrivateLessonModal({
  areas,
  children = [],
  initialCity = "",
  initialDistrict = "",
  initialGradeLevel,
  onCreated,
}: {
  areas: Area[];
  children?: Child[];
  initialCity?: string | null;
  initialDistrict?: string | null;
  initialGradeLevel?: string | null;
  onCreated?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { isSubscriber } = useSubscriptionStatus();

  // Form State
  const [childProfileId, setChildProfileId] = useState("");
  const [areaId, setAreaId] = useState<number | "">("");
  const [gradeLevel, setGradeLevel] = useState(initialGradeLevel || GRADE_LEVEL_OPTIONS[8]);
  const [mode, setMode] = useState<"online" | "in_person" | "both">("both");
  const [city, setCity] = useState(initialCity || "");
  const [district, setDistrict] = useState(initialDistrict || "");
  const [budgetTry, setBudgetTry] = useState("");
  const [description, setDescription] = useState("");
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  // Taslağı yükle (State Persistence)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.description) setDescription(draft.description);
        if (draft.budgetTry) setBudgetTry(draft.budgetTry);
        if (draft.areaId) setAreaId(draft.areaId);
        if (draft.gradeLevel) setGradeLevel(draft.gradeLevel);
        if (draft.mode) setMode(draft.mode);
        if (draft.city) setCity(draft.city);
        if (draft.district) setDistrict(draft.district);
        if (draft.childProfileId) setChildProfileId(draft.childProfileId);
        setHasSavedDraft(true);
      }
    } catch {
      // sessizce geç
    }
  }, []);

  // Form değiştikçe taslağı kaydet
  useEffect(() => {
    if (!description && !budgetTry && !city) return;
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          description,
          budgetTry,
          areaId,
          gradeLevel,
          mode,
          city,
          district,
          childProfileId,
        }),
      );
      setHasSavedDraft(true);
    } catch {
      // sessizce geç
    }
  }, [description, budgetTry, areaId, gradeLevel, mode, city, district, childProfileId]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setDescription("");
      setBudgetTry("");
      setCity(initialCity || "");
      setDistrict(initialDistrict || "");
      setAreaId("");
      setHasSavedDraft(false);
    } catch {
      // sessizce geç
    }
  };

  // ESC tuşu ile kapatma
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  // Şehir seçildiğinde o şehrin ilçelerini bul
  const selectedCityData = useMemo(
    () => turkeyData.find((t) => t.city === city),
    [city],
  );

  // Şehirler alfabetik
  const sortedCities = useMemo(
    () => [...turkeyData].sort((a, b) => a.city.localeCompare(b.city, "tr-TR")),
    [],
  );

  // Jenerik branş isimlerini çıkarıp alfabetik sırala
  const genericBranches = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of areas) {
      const genericName = displayEducationAreaName(a.area_name);
      if (!map.has(genericName)) {
        map.set(genericName, a.id);
      }
    }
    return Array.from(map.entries())
      .map(([name, id]) => ({ name, id }))
      .sort((a, b) => a.name.localeCompare(b.name, "tr-TR"));
  }, [areas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaId) {
      setError("Lütfen ders branşını seçin.");
      return;
    }
    if (description.trim().length < 15) {
      setError("Lütfen ders ihtiyacınızı en az 15 karakterle açıklayın.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/private-lessons/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId: Number(areaId),
          gradeLevel,
          mode,
          city: city.trim() || null,
          district: district.trim() || null,
          description: description.trim(),
          budgetTry: budgetTry ? Number(budgetTry) : null,
          childProfileId: childProfileId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "İlan oluşturulamadı.");
      }

      // Haptic geri bildirim
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([30, 60, 30]);
      }

      // Taslağı temizle
      clearDraft();

      setSuccessMessage("Özel ders talebiniz başarıyla yayınlandı! Öğretmen teklifleri gelmeye başladığında bildirim alacaksınız.");

      // Listeyi canlı güncelle
      window.dispatchEvent(new CustomEvent("zigo:lesson-post-created"));
      if (onCreated) onCreated();

      setTimeout(() => {
        setIsOpen(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="zigo-action-chip tap-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 py-3 text-xs font-black text-white shadow-md shadow-emerald-500/20 hover:scale-[1.01] transition-transform"
        type="button"
      >
        <span>🎯</span>
        <span>Özel Ders İlanı Yayınla</span>
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lesson-modal-title"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto bg-black/60 p-4 sm:p-6 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-lg my-auto rounded-3xl bg-white p-6 shadow-2xl text-night border border-slate-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Başlığı */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 text-lg font-bold">
                  🎯
                </div>
                <div>
                  <h3 id="lesson-modal-title" className="text-base font-black text-night">
                    Özel Ders Talebi Oluştur
                  </h3>
                  <p className="text-[0.68rem] font-bold text-slate-500">
                    Branş öğretmenlerinden doğrudan fiyat ve ders teklifleri alın
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="tap-scale flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                type="button"
                aria-label="Kapat"
              >
                ✕
              </button>
            </div>

            {/* Abonesiz Veli Uyarısı (Abonelik Önleyici Kanca) */}
            {!isSubscriber ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
                <span className="text-xl">🔒</span>
                <h4 className="mt-1 text-xs font-black text-amber-900">
                  Zigo Plus Veli Aboneliği Gerekir
                </h4>
                <p className="mt-1 text-[0.7rem] font-semibold text-amber-800 leading-relaxed">
                  Öğretmenlerden teklif toplamak ve doğrudan iletişim kurmak için Zigo Plus aboneliği gereklidir. İlk 7 gün ücretsiz deneyebilirsiniz.
                </p>
                <Link
                  href="/pricing"
                  className="tap-scale mt-3 inline-block rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-black text-slate-950 shadow-sm"
                >
                  7 Gün Ücretsiz Başla ✨
                </Link>
              </div>
            ) : null}

            {error ? (
              <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-600 border border-rose-200">
                {error}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-xs font-black text-emerald-800 border border-emerald-200 text-center animate-in zoom-in-95">
                ✓ {successMessage}
              </div>
            ) : null}

            {!successMessage ? (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                {children.length > 0 ? (
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      Öğrenci / Çocuk Seçimi (Opsiyonel)
                    </label>
                    <select
                      value={childProfileId}
                      onChange={(e) => setChildProfileId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-night focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Genel / Kendim İçin</option>
                      {children.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      Branş / Ders Alanı *
                    </label>
                    <select
                      required
                      value={areaId}
                      onChange={(e) => setAreaId(e.target.value ? Number(e.target.value) : "")}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-night focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Branş Seçin</option>
                      {genericBranches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      Sınıf / Seviye *
                    </label>
                    <select
                      required
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-night focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {GRADE_LEVEL_OPTIONS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Ders Şekli *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { id: "online", label: "💻 Online" },
                      { id: "in_person", label: "🏫 Yüz Yüze" },
                      { id: "both", label: "🔄 Farketmez" },
                    ] as const).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setMode(item.id)}
                        className={`rounded-xl border py-2 text-center text-xs font-black transition ${
                          mode === item.id
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {mode !== "online" ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">
                        İl (Şehir) *
                      </label>
                      <select
                        required
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          setDistrict("");
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-night focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">İl Seçin</option>
                        {sortedCities.map((c) => (
                          <option key={c.city} value={c.city}>
                            {c.city}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">
                        İlçe / Bölge *
                      </label>
                      <select
                        required
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        disabled={!city}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-night focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                      >
                        <option value="">İlçe Seçin</option>
                        {selectedCityData?.districts
                          .sort((a, b) => a.localeCompare(b, "tr-TR"))
                          .map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                ) : null}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-slate-700">
                      Saatlik Bütçe Beklentiniz (₺) (Opsiyonel)
                    </label>
                    <span className="text-[10px] text-slate-400 font-bold">Saat Başına</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="Örn: 500"
                    value={budgetTry}
                    onChange={(e) => setBudgetTry(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-night focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-slate-700">
                      Ders İhtiyacı ve Açıklama *
                    </label>
                    <span
                      className={`text-[10px] font-bold ${
                        description.length < 15 ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      {description.length} / 1500 (Min. 15)
                    </span>
                  </div>
                  <textarea
                    required
                    rows={3}
                    maxLength={1500}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Öğrencinin seviyesi, hedefi (örn. LGS Deneme net artışı, konu eksikleri) ve uygun saatler..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-night focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {hasSavedDraft ? (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <span>💾 Taslak tarayıcınızda güvende</span>
                    <button
                      type="button"
                      onClick={clearDraft}
                      className="font-bold text-rose-600 hover:underline"
                    >
                      Taslağı Sıfırla
                    </button>
                  </div>
                ) : null}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || !isSubscriber}
                    className="tap-scale w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-black text-white shadow-lg shadow-emerald-600/25 transition hover:brightness-105 disabled:opacity-50"
                  >
                    {isLoading ? "İlan Yayınlanıyor..." : "Talebi Yayına Al 🚀"}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
