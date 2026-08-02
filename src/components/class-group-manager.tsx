"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { GRADE_LEVEL_OPTIONS } from "@/lib/domain/grade-level";
import { useMessages } from "@/lib/i18n/locale-context";

type ClassGroupManagerProps = {
  isSubscriber: boolean;
  childProfileId?: string | null;
  initialCity?: string | null;
  initialDistrict?: string | null;
  initialSchoolName?: string | null;
  initialGradeLevel?: string | null;
  initialClassroom?: string | null;
  userRole?: "student" | "parent";
};

type GroupData = {
  group: {
    id: string;
    group_name: string;
    city: string;
    district: string;
    school_name: string;
    grade_level: string;
  } | null;
  memberCount: number;
  isJoined: boolean;
  userLocation: {
    city: string | null;
    district: string | null;
    schoolName: string | null;
    gradeLevel: string | null;
    classroom: string | null;
  };
};

export function ClassGroupManager({
  isSubscriber,
  childProfileId = null,
  initialCity = "",
  initialDistrict = "",
  initialSchoolName = "",
  initialGradeLevel = "",
  initialClassroom = "",
  userRole = "student",
}: ClassGroupManagerProps) {
  const b = useMessages().billingUi;
  const plansHref = userRole === "parent" ? "/parent#zigo-plus-plans" : "/student#zigo-plus-plans";
  const [city, setCity] = useState(initialCity ?? "");
  const [district, setDistrict] = useState(initialDistrict ?? "");
  const [schoolName, setSchoolName] = useState(initialSchoolName ?? "");
  const [gradeLevel, setGradeLevel] = useState(initialGradeLevel ?? "");
  const [classroom, setClassroom] = useState(initialClassroom ?? "");
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSubscriber) return;

    let ignore = false;
    async function fetchGroup() {
      setStatus("loading");
      try {
        const query = childProfileId ? `?childProfileId=${childProfileId}` : "";
        const res = await fetch(`/api/class-groups${query}`);
        const json = (await res.json().catch(() => null)) as { data?: GroupData } | null;
        if (!ignore && res.ok && json?.data) {
          setGroupData(json.data);
          if (json.data.userLocation.city) setCity(json.data.userLocation.city);
          if (json.data.userLocation.district) setDistrict(json.data.userLocation.district);
          if (json.data.userLocation.schoolName) setSchoolName(json.data.userLocation.schoolName);
          if (json.data.userLocation.gradeLevel) setGradeLevel(json.data.userLocation.gradeLevel);
          if (json.data.userLocation.classroom) setClassroom(json.data.userLocation.classroom);
          setStatus("idle");
        } else if (!ignore) {
          setStatus("idle");
        }
      } catch {
        if (!ignore) setStatus("idle");
      }
    }

    void fetchGroup();
    return () => {
      ignore = true;
    };
  }, [childProfileId, isSubscriber]);

  async function handleJoinOrSave() {
    if (!city || !district || !schoolName || !gradeLevel) {
      setStatus("error");
      setMessage("Lütfen il, ilçe, okul ve sınıf bilgilerinin tamamını doldurun.");
      return;
    }

    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/class-groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          district,
          schoolName,
          gradeLevel,
          classroom,
          childProfileId,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        data?: GroupData["group"];
        error?: string;
      } | null;

      if (!response.ok) {
        setStatus("error");
        setMessage(payload?.error ?? "Sınıf grubuna katılım sağlanamadı.");
        return;
      }

      setStatus("success");
      setMessage("Sınıf grubunuza başarıyla katıldınız!");
      // Reload group data
      const query = childProfileId ? `?childProfileId=${childProfileId}` : "";
      const res = await fetch(`/api/class-groups${query}`);
      const json = (await res.json().catch(() => null)) as { data?: GroupData } | null;
      if (res.ok && json?.data) {
        setGroupData(json.data);
      }
    } catch {
      setStatus("error");
      setMessage("Bağlantı hatası.");
    }
  }

  async function handleLeave() {
    if (!groupData?.group?.id) return;

    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/class-groups/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: groupData.group.id,
          childProfileId,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setStatus("error");
        setMessage(payload?.error ?? "Gruptan ayrılınamadı.");
        return;
      }

      setStatus("success");
      setMessage("Sınıf grubundan ayrıldınız. (İsteğe bağlı olarak tekrar katılabilirsiniz)");
      setGroupData((prev) => (prev ? { ...prev, isJoined: false, memberCount: Math.max(0, prev.memberCount - 1) } : null));
    } catch {
      setStatus("error");
      setMessage("Bağlantı hatası.");
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">
            {userRole === "parent" ? "Veli & Öğrenci Topluluğu" : "Öğrenci Topluluğu"}
          </p>
          <h2 className="mt-1 text-xl font-black text-night">İl - İlçe - Okul - Sınıf Grupları</h2>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${
            isSubscriber
              ? "bg-gradient-to-r from-crystal to-berry text-white shadow-sm"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {isSubscriber ? b.lockBadgeSubscriber : b.lockBadgeLocked}
        </span>
      </div>

      {!isSubscriber ? (
        <div className="mt-4 rounded-xl border border-pink-200/80 bg-gradient-to-br from-pink-50/90 via-purple-50/50 to-white p-5 text-night shadow-inner">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-crystal via-berry to-night text-2xl text-white shadow-md">
              👑
            </div>
            <div className="space-y-2 text-sm">
              <h3 className="font-black text-night">{b.classGroupLockTitle}</h3>
              <p className="font-semibold leading-relaxed text-slate-600">{b.classGroupLockDesc}</p>
              <ul className="list-inside list-disc space-y-1 text-xs font-bold text-slate-700">
                <li>{b.classGroupLockBenefitAds}</li>
                <li>{b.classGroupLockBenefitPoints}</li>
                <li>{b.classGroupLockBenefitGroups}</li>
              </ul>
              <div className="pt-2">
                <Link
                  href={plansHref}
                  className="tap-scale inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-night via-crystal to-berry px-5 py-3 text-sm font-black text-white shadow-lg shadow-crystal/25 transition-all hover:opacity-95"
                >
                  {b.classGroupLockCta}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="text-sm font-semibold text-slate-600">
            İl, ilçe, okul ve sınıf bilginizi girerek okulunuzdaki arkadaşlarınızla aynı gruba dahil olabilir, isteğe bağlı olarak gruba giriş veya çıkış yapabilirsiniz.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="city-input" className="block text-xs font-bold text-slate-600">
                İl (Şehir)
              </label>
              <input
                id="city-input"
                type="text"
                placeholder="Örn: İstanbul, Ankara, İzmir..."
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setStatus("idle");
                }}
                className="mt-1 w-full rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-night border border-slate-200 outline-none focus:border-crystal focus:bg-white focus:ring-2 focus:ring-crystal/20"
              />
            </div>

            <div>
              <label htmlFor="district-input" className="block text-xs font-bold text-slate-600">
                İlçe
              </label>
              <input
                id="district-input"
                type="text"
                placeholder="Örn: Kadıköy, Çankaya..."
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setStatus("idle");
                }}
                className="mt-1 w-full rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-night border border-slate-200 outline-none focus:border-crystal focus:bg-white focus:ring-2 focus:ring-crystal/20"
              />
            </div>

            <div>
              <label htmlFor="school-input" className="block text-xs font-bold text-slate-600">
                Okul Adı
              </label>
              <input
                id="school-input"
                type="text"
                placeholder="Örn: Atatürk Ortaokulu..."
                value={schoolName}
                onChange={(e) => {
                  setSchoolName(e.target.value);
                  setStatus("idle");
                }}
                className="mt-1 w-full rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-night border border-slate-200 outline-none focus:border-crystal focus:bg-white focus:ring-2 focus:ring-crystal/20"
              />
            </div>

            <div>
              <label htmlFor="grade-select" className="block text-xs font-bold text-slate-600">
                Sınıf Seviyesi
              </label>
              <select
                id="grade-select"
                value={gradeLevel}
                onChange={(e) => {
                  setGradeLevel(e.target.value);
                  setStatus("idle");
                }}
                className="mt-1 w-full rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-night border border-slate-200 outline-none focus:border-crystal focus:bg-white focus:ring-2 focus:ring-crystal/20"
              >
                <option value="">Sınıf Seçin</option>
                {GRADE_LEVEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="classroom-select" className="block text-xs font-bold text-slate-600">
                Şube Seçimi
              </label>
              <select
                id="classroom-select"
                value={classroom}
                onChange={(e) => {
                  setClassroom(e.target.value);
                  setStatus("idle");
                }}
                className="mt-1 w-full rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-night border border-slate-200 outline-none focus:border-crystal focus:bg-white focus:ring-2 focus:ring-crystal/20"
              >
                <option value="">Şube Yok / Bilinmiyor</option>
                {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"].map((option) => (
                  <option key={option} value={option}>
                    {option} Şubesi
                  </option>
                ))}
              </select>
            </div>
          </div>

          {groupData?.group ? (
            <div className="mt-2 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-indigo-600">Eşleşen Sınıf Grubu</p>
                  <h4 className="text-base font-black text-night">{groupData.group.group_name}</h4>
                  <p className="text-xs font-bold text-slate-600">
                    📍 {groupData.group.city} / {groupData.group.district} — {groupData.memberCount} Topluluk Üyesi
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {groupData.isJoined ? (
                    <span className="inline-flex items-center rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-black text-white shadow-sm">
                      ✅ Gruptasınız
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              disabled={status === "saving" || status === "loading"}
              onClick={() => void handleJoinOrSave()}
              className="tap-scale flex-1 rounded-xl bg-gradient-to-r from-crystal to-berry px-5 py-3 text-sm font-black text-white shadow-md disabled:opacity-60"
            >
              {status === "saving"
                ? "İşleniyor..."
                : groupData?.isJoined
                  ? "Bilgileri Güncelle"
                  : "🤝 Sınıf Grubuna İsteğe Bağlı Katıl"}
            </button>

            {groupData?.isJoined ? (
              <button
                type="button"
                disabled={status === "saving" || status === "loading"}
                onClick={() => void handleLeave()}
                className="tap-scale rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600 hover:bg-red-100 disabled:opacity-60"
              >
                Gruptan İsteğe Bağlı Ayrıl
              </button>
            ) : null}
          </div>

          {message ? (
            <p
              className={`text-xs font-bold ${
                status === "error" ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {message}
            </p>
          ) : null}

          <p className="text-[0.7rem] font-semibold text-slate-400">
            * Sınıf gruplarına katılım tamamen isteğe bağlıdır. İstediğiniz zaman okul veya sınıf bilginizi değiştirebilir, tek tıkla gruptan ayrılabilirsiniz.
          </p>
        </div>
      )}
    </section>
  );
}
