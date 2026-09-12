"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { RegistrationAccountPicker } from "@/components/registration-account-picker";
import { SearchableSchoolSelect } from "@/components/searchable-school-select";
import { GRADE_LEVEL_OPTIONS } from "@/lib/domain/grade-level";
import { type RequiredSignupOptionId } from "@/lib/domain/registration-account";
import { TURKEY_CITIES } from "@/lib/domain/turkey-locations";
import { useMessages } from "@/lib/i18n/locale-context";

type Status = "idle" | "saving" | "saved" | "error";

export function ProfileForm({ redirectTo }: { redirectTo?: string } = {}) {
  const m = useMessages();
  const p = m.profileForm;
  const auth = m.auth;
  const onboarding = m.onboarding;
  const router = useRouter();

  const [accountKind, setAccountKind] = useState<RequiredSignupOptionId | null>(null);
  const [city, setCity] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [schoolName, setSchoolName] = useState<string>("");
  const [gradeLevel, setGradeLevel] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const isLearnerRole = accountKind === "student" || accountKind === "parent";

  // When city changes, reset district & school
  function handleCityChange(nextCity: string) {
    setCity(nextCity);
    setDistrict("");
    setSchoolName("");
  }

  // When district changes, reset school
  function handleDistrictChange(nextDistrict: string) {
    setDistrict(nextDistrict);
    setSchoolName("");
  }

  const availableDistricts = TURKEY_CITIES.find((c) => c.name === city)?.districts || [];

  const canSubmit =
    accountKind !== null &&
    Boolean(city.trim()) &&
    Boolean(district.trim()) &&
    (!isLearnerRole || Boolean(gradeLevel.trim())) &&
    termsAccepted &&
    status !== "saving";

  async function submitProfile(formData: FormData) {
    if (!canSubmit) {
      if (!accountKind) setMessage("Lütfen önce bir hesap türü seçin.");
      else if (!city.trim()) setMessage("Lütfen bulunduğunuz şehri (il) seçin.");
      else if (!district.trim()) setMessage("Lütfen bulunduğunuz ilçeyi seçin.");
      else if (isLearnerRole && !gradeLevel.trim()) setMessage("Lütfen sınıf seviyenizi seçin.");
      else if (!termsAccepted) setMessage("Lütfen Kullanım Koşulları ve Gizlilik Politikasını kabul edin.");
      return;
    }

    setStatus("saving");
    setMessage(p.creating);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.get("fullName"),
          accountKind,
          city,
          district,
          schoolName: schoolName.trim() || undefined,
          gradeLevel: gradeLevel.trim() || undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setStatus("error");
        setMessage(payload?.error ?? p.createFailed);
        return;
      }

      setStatus("saved");
      setMessage(p.created);
      router.refresh();

      if (redirectTo) {
        setTimeout(() => {
          router.push(redirectTo);
        }, 500);
      }
    } catch {
      setStatus("error");
      setMessage(p.setupCheck);
    }
  }

  return (
    <form action={submitProfile} className="-mx-4 space-y-5 bg-white px-4 py-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
          {onboarding.createProfile}
        </p>
        <h3 className="mt-1 text-2xl font-black leading-tight text-night">
          {onboarding.chooseFeed}
        </h3>
      </div>

      <div>
        <label htmlFor="full-name" className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
          {auth.fullName}
        </label>
        <input
          id="full-name"
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-night focus:ring-2 focus:ring-crystal focus:ring-offset-2"
          name="fullName"
          placeholder={p.namePlaceholder}
          required
          aria-describedby={status === "error" ? "profile-message" : undefined}
          aria-invalid={status === "error"}
        />
      </div>

      {/* Account Kind Selection */}
      <RegistrationAccountPicker value={accountKind} onChange={setAccountKind} />

      {/* Mandatory City Selection */}
      <div>
        <label htmlFor="city-select" className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
          Bulunduğunuz İl * <span className="text-rose-500 text-[0.68rem] font-bold">(Zorunlu)</span>
        </label>
        <select
          id="city-select"
          required
          value={city}
          onChange={(e) => handleCityChange(e.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-night outline-none transition focus:border-night focus:ring-2 focus:ring-crystal focus:ring-offset-2"
        >
          <option value="">-- Bulunduğunuz İli Seçin --</option>
          {TURKEY_CITIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Mandatory District Selection */}
      <div>
        <label htmlFor="district-select" className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
          Bulunduğunuz İlçe * <span className="text-rose-500 text-[0.68rem] font-bold">(Zorunlu)</span>
        </label>
        <select
          id="district-select"
          required
          disabled={!city}
          value={district}
          onChange={(e) => handleDistrictChange(e.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-night outline-none transition focus:border-night focus:ring-2 focus:ring-crystal focus:ring-offset-2 disabled:opacity-60 disabled:bg-slate-100"
        >
          <option value="">{city ? "-- Bulunduğunuz İlçeyi Seçin --" : "-- Önce İl Seçin --"}</option>
          {availableDistricts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Optional School & Grade Level fields (Öğrenci & Veli için opsiyonel) */}
      {isLearnerRole ? (
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600">
              Okul ve Sınıf Bilgileri
            </span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[0.62rem] font-bold text-slate-600">
              İsteğe Bağlı (Opsiyonel)
            </span>
          </div>
          <p className="text-[0.72rem] text-slate-500 leading-relaxed">
            Okulunuzu ve sınıfınızı şimdi seçebilir veya profilinizden daha sonra dilediğiniz zaman belirleyebilirsiniz.
          </p>

          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">
              {accountKind === "parent" ? "Öğrencinin Okulu (Opsiyonel)" : "Okulunuz (Opsiyonel)"}
            </label>
            <SearchableSchoolSelect
              city={city}
              district={district}
              value={schoolName}
              onChange={setSchoolName}
              disabled={!city || !district}
            />
          </div>

          <div>
            <label htmlFor="grade-select" className="text-xs font-bold text-slate-700 mb-1.5 block">
              {accountKind === "parent" ? "Öğrencinin Sınıfı / Hazırlık *" : "Sınıfınız / Hazırlık *"}{" "}
              <span className="text-rose-500 text-[0.68rem] font-bold">(Zorunlu)</span>
            </label>
            <select
              id="grade-select"
              required
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm font-bold text-night border border-slate-200 outline-none transition focus:border-crystal focus:ring-2 focus:ring-crystal/20"
            >
              <option value="">-- Lütfen Sınıf Seçin (Zorunlu) --</option>
              {GRADE_LEVEL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <input
          required
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-0.5 size-4 rounded border-slate-300 text-crystal focus:ring-crystal"
        />
        <span className="text-xs font-semibold leading-relaxed text-slate-700">
          <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="font-bold text-crystal underline">
            Kullanım Koşullarını
          </a>{" "}
          ve{" "}
          <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="font-bold text-crystal underline">
            Gizlilik Politikasını
          </a>{" "}
          okudum, kabul ediyorum. *
        </span>
      </label>

      <button
        className={`tap-scale w-full rounded-lg px-4 py-3.5 text-sm font-black text-white transition focus:outline-none focus:ring-2 focus:ring-crystal focus:ring-offset-2 ${
          canSubmit
            ? "zigo-cta"
            : "cursor-not-allowed bg-slate-300 opacity-60"
        }`}
        disabled={!canSubmit}
        type="submit"
        aria-busy={status === "saving"}
      >
        {status === "saving" ? p.creating : p.createProfile}
      </button>

      {message ? (
        <p
          className={`rounded-lg px-4 py-3 text-sm font-bold ${
            status === "error"
              ? "bg-red-50 text-red-600"
              : status === "saved"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-violet-50 text-crystal"
          }`}
          id="profile-message"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
