"use client";

import { useMemo, useState } from "react";

import { displayEducationAreaName } from "@/lib/domain/education-catalog";
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

export function CreatePrivateLessonModal({
  areas,
  children = [],
  onCreated,
}: {
  areas: Area[];
  children?: Child[];
  onCreated?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [childProfileId, setChildProfileId] = useState("");
  const [areaId, setAreaId] = useState<number | "">("");
  const [gradeLevel, setGradeLevel] = useState(GRADE_LEVEL_OPTIONS[8]);
  const [mode, setMode] = useState<"online" | "in_person" | "both">("both");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [budgetTry, setBudgetTry] = useState("");
  const [description, setDescription] = useState("");

  // Şehir seçildiğinde o şehrin ilçelerini bul
  const selectedCityData = useMemo(
    () => turkeyData.find((t) => t.city === city),
    [city]
  );
  
  // Şehirler alfabetik
  const sortedCities = useMemo(
    () => [...turkeyData].sort((a, b) => a.city.localeCompare(b.city, 'tr-TR')),
    []
  );

  // Sadece jenerik branş isimlerini çıkarıp tekilleştiriyoruz (örn: "1-4 Matematik" -> "Matematik")
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
      .sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));
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

      setIsOpen(false);
      setDescription("");
      setBudgetTry("");
      setCity("");
      setDistrict("");
      if (onCreated) onCreated();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="zigo-action-chip tap-scale col-span-2 mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform"
        type="button"
      >
        <span>🎯</span>
        <span>Özel Ders İlanı Yayınla</span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white p-5 shadow-2xl text-night">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold">
                  🎯
                </div>
                <div>
                  <h3 className="text-base font-black text-night">Özel Ders Talebi Oluştur</h3>
                  <p className="text-[0.7rem] font-bold text-slate-500">
                    Sadece uygun branştaki Zigo Plus öğretmenleri teklif verebilir (Maks. 5 Teklif)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                type="button"
              >
                ✕
              </button>
            </div>

            {error ? (
              <div className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-600">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              {children.length > 0 ? (
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Öğrenci / Çocuk Seçimi (Opsiyonel)</label>
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
                  <label className="block text-xs font-black text-slate-700 mb-1">Branş / Alan *</label>
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
                  <label className="block text-xs font-black text-slate-700 mb-1">Sınıf / Seviye *</label>
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
                <label className="block text-xs font-black text-slate-700 mb-1">Ders Şekli *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "online", label: "Online 💻" },
                    { id: "in_person", label: "Yüz Yüze 🏫" },
                    { id: "both", label: "Farketmez 🔄" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMode(item.id as any)}
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
                    <label className="block text-xs font-black text-slate-700 mb-1">İl (Şehir) *</label>
                    <select
                      required
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setDistrict(""); // Şehir değişince ilçeyi sıfırla
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
                    <label className="block text-xs font-black text-slate-700 mb-1">İlçe / Bölge *</label>
                    <select
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      disabled={!city}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-night focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      <option value="">İlçe Seçin</option>
                      {selectedCityData?.districts
                        .sort((a, b) => a.localeCompare(b, 'tr-TR'))
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
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Saatlik Bütçe Beklentiniz (₺) (Opsiyonel)
                </label>
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
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Ders İhtiyacı ve Açıklama * (Min. 15 karakter)
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Öğrencinin seviyesi, hedefi (örn. LGS Deneme net artışı, konu eksikleri) ve uygun saatler..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-night focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-black text-white shadow-lg shadow-emerald-600/30 transition hover:brightness-110 disabled:opacity-50"
                >
                  {isLoading ? "İlan Yayınlanıyor..." : "İlanı Yayınla 🚀"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
