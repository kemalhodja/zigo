"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { RegistrationAccountPicker } from "@/components/registration-account-picker";
import { type RequiredSignupOptionId } from "@/lib/domain/registration-account";
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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = accountKind !== null && Boolean(city.trim()) && termsAccepted && status !== "saving";

  async function submitProfile(formData: FormData) {
    if (!canSubmit) {
      if (!accountKind) setMessage("Lütfen önce bir hesap türü seçin.");
      else if (!city.trim()) setMessage("Lütfen bulunduğunuz şehri (il) seçin.");
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

      {/* Mandatory City Selection */}
      <div>
        <label htmlFor="city-select" className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
          Bulunduğunuz Şehir (İl) *
        </label>
        <select
          id="city-select"
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-night outline-none transition focus:border-night focus:ring-2 focus:ring-crystal focus:ring-offset-2"
        >
          <option value="">-- Bulunduğunuz Şehri Seçin --</option>
          {[
            "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
            "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
            "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari",
            "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
            "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
            "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
            "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
            "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
          ].map((cityName) => (
            <option key={cityName} value={cityName}>
              {cityName}
            </option>
          ))}
        </select>
      </div>

      <RegistrationAccountPicker value={accountKind} onChange={setAccountKind} />

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
