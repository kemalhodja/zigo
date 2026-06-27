"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode,useMemo, useState } from "react";

import type { EducationOrganizationType } from "@/lib/domain/education-organization";
import type {
  EducationDegree,
  EducationPlatformProfileExtras,
  InstitutionProfileExtras,
  ProfessionalProfileKind,
  TeacherProfileExtras,
  TeachingStyle,
} from "@/lib/domain/professional-profile";
import {
  educationDegreeSchema,
  institutionExpertiseStepSchema,
  platformExpertiseStepSchema,
  professionalGeneralStepSchema,
  teacherExpertiseStepSchema,
  teacherFinancialStepSchema,
  teachingStyleSchema,
} from "@/lib/domain/professional-profile";

type WizardInitial = {
  kind: ProfessionalProfileKind;
  fullName: string;
  bio: string | null;
  avatarUrl: string | null;
  organizationType: EducationOrganizationType | null;
  teacher: TeacherProfileExtras | null;
  institution: InstitutionProfileExtras | null;
  platform: EducationPlatformProfileExtras | null;
};

type ProfessionalProfileWizardProps = {
  initial: WizardInitial;
};

const STEPS = ["Genel", "Uzmanlık", "Finansal / İletişim"] as const;

export function ProfessionalProfileWizard({ initial }: ProfessionalProfileWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [bio, setBio] = useState(initial.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl ?? "");

  const [cvUrl, setCvUrl] = useState(initial.teacher?.cv_url ?? "");
  const [yearsOfExperience, setYearsOfExperience] = useState(
    String(initial.teacher?.years_of_experience ?? ""),
  );
  const [educationDegree, setEducationDegree] = useState<EducationDegree>(
    (initial.teacher?.education_degree as EducationDegree | null) ?? "lisans",
  );
  const [teachingStyle, setTeachingStyle] = useState<TeachingStyle>(
    (initial.teacher?.teaching_style as TeachingStyle | null) ?? "visual",
  );
  const [hourlyRate, setHourlyRate] = useState(String(initial.teacher?.hourly_rate ?? ""));
  const [responseTimeMinutes, setResponseTimeMinutes] = useState(
    String(initial.teacher?.response_time_minutes ?? initial.institution?.response_time_minutes ?? initial.platform?.response_time_minutes ?? "30"),
  );
  const [lessonAcceptanceRate, setLessonAcceptanceRate] = useState(
    String(initial.teacher?.lesson_acceptance_rate_percent ?? "95"),
  );
  const [contactSummary, setContactSummary] = useState(
    initial.teacher?.contact_summary ?? initial.institution?.contact_summary ?? initial.platform?.contact_summary ?? "",
  );

  const [licenseNumber, setLicenseNumber] = useState(initial.institution?.license_number ?? "");
  const [capacity, setCapacity] = useState(String(initial.institution?.capacity ?? "100"));
  const [branchCount, setBranchCount] = useState(String(initial.institution?.branch_count ?? "1"));
  const [accreditation, setAccreditation] = useState(
    (initial.institution?.accreditation ?? []).join(", "),
  );
  const [services, setServices] = useState((initial.institution?.services ?? []).join(", "));

  const [contentCount, setContentCount] = useState(String(initial.platform?.content_count ?? "0"));
  const [userBaseSize, setUserBaseSize] = useState(String(initial.platform?.user_base_size ?? "0"));
  const [subscriptionModel, setSubscriptionModel] = useState(initial.platform?.subscription_model ?? "freemium");
  const [integrationDocsUrl, setIntegrationDocsUrl] = useState(initial.platform?.integration_docs_url ?? "");

  const sharedExtras = initial.teacher ?? initial.institution ?? initial.platform;
  const [videoIntroUrl, setVideoIntroUrl] = useState(sharedExtras?.video_intro_url ?? "");
  const [softSkills, setSoftSkills] = useState((sharedExtras?.soft_skills ?? []).join(", "));
  const [availabilityStatus, setAvailabilityStatus] = useState<
    "available" | "busy" | "scheduled"
  >(sharedExtras?.availability_status ?? "available");
  const [availabilityNote, setAvailabilityNote] = useState(sharedExtras?.availability_note ?? "");
  const [certificates, setCertificates] = useState(() => {
    const details = sharedExtras?.details as Record<string, unknown> | undefined;
    return Array.isArray(details?.certificates) ? (details.certificates as string[]).join(", ") : "";
  });

  function portfolioPayload() {
    return {
      videoIntroUrl: videoIntroUrl || undefined,
      softSkills: splitList(softSkills),
      availabilityStatus,
      availabilityNote: availabilityNote || undefined,
      certificates: initial.kind === "teacher" ? splitList(certificates) : undefined,
    };
  }

  const title = useMemo(() => {
    if (initial.kind === "institution") return "Kurumsal Profil";
    if (initial.kind === "platform") return "Platform Profili";
    return "Profesyonel Öğretmen Profili";
  }, [initial.kind]);

  function splitList(value: string) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async function saveStep() {
    setBusy(true);
    setMessage("");
    setErrors({});

    try {
      if (step === 0) {
        const parsed = professionalGeneralStepSchema.safeParse({ bio, avatarUrl: avatarUrl || undefined });
        if (!parsed.success) {
          setErrors({ bio: parsed.error.issues[0]?.message ?? "Geçersiz alan" });
          return;
        }
        await patch({ general: { bio, avatarUrl: avatarUrl || undefined } });
        setStep(1);
        return;
      }

      if (step === 1) {
        if (initial.kind === "teacher") {
          const parsed = teacherExpertiseStepSchema.safeParse({
            cvUrl: cvUrl || undefined,
            yearsOfExperience,
            educationDegree,
            teachingStyle,
          });
          if (!parsed.success) {
            const fieldErrors: Record<string, string> = {};
            for (const issue of parsed.error.issues) {
              fieldErrors[String(issue.path[0])] = issue.message;
            }
            setErrors(fieldErrors);
            return;
          }
        } else if (initial.kind === "institution") {
          const parsed = institutionExpertiseStepSchema.safeParse({
            licenseNumber,
            capacity,
            branchCount,
            accreditation: splitList(accreditation),
            services: splitList(services),
          });
          if (!parsed.success) {
            const fieldErrors: Record<string, string> = {};
            for (const issue of parsed.error.issues) {
              fieldErrors[String(issue.path[0])] = issue.message;
            }
            setErrors(fieldErrors);
            return;
          }
        } else {
          const parsed = platformExpertiseStepSchema.safeParse({
            contentCount,
            userBaseSize,
            subscriptionModel,
            integrationDocsUrl: integrationDocsUrl || undefined,
          });
          if (!parsed.success) {
            const fieldErrors: Record<string, string> = {};
            for (const issue of parsed.error.issues) {
              fieldErrors[String(issue.path[0])] = issue.message;
            }
            setErrors(fieldErrors);
            return;
          }
        }
        setStep(2);
        return;
      }

      if (initial.kind === "teacher") {
        const expertise = teacherExpertiseStepSchema.parse({
          cvUrl: cvUrl || undefined,
          yearsOfExperience,
          educationDegree,
          teachingStyle,
        });
        const financial = teacherFinancialStepSchema.parse({
          hourlyRate,
          responseTimeMinutes,
          lessonAcceptanceRatePercent: lessonAcceptanceRate,
          contactSummary: contactSummary || undefined,
        });
        await patch({ teacher: { ...expertise, ...financial, ...portfolioPayload() } });
      } else if (initial.kind === "institution") {
        await patch({
          institution: {
            licenseNumber,
            capacity,
            branchCount,
            accreditation: splitList(accreditation),
            services: splitList(services),
            responseTimeMinutes,
            contactSummary: contactSummary || undefined,
            ...portfolioPayload(),
          },
        });
      } else {
        await patch({
          platform: {
            contentCount,
            userBaseSize,
            subscriptionModel,
            integrationDocsUrl: integrationDocsUrl || undefined,
            responseTimeMinutes,
            contactSummary: contactSummary || undefined,
            ...portfolioPayload(),
          },
        });
      }

      setMessage("Profil kaydedildi.");
      router.refresh();
      router.push("/profile");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kayıt başarısız.");
    } finally {
      setBusy(false);
    }
  }

  async function patch(body: Record<string, unknown>) {
    const response = await fetch("/api/profile/professional", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      throw new Error(payload?.error ?? "Kayıt başarısız.");
    }
  }

  return (
    <div className="space-y-5">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-4">
        <Link className="text-xs font-black text-crystal" href="/profile">
          ← Profile dön
        </Link>
        <h2 className="mt-2 text-2xl font-black text-night">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{initial.fullName}</p>
        <div className="mt-4 flex gap-2">
          {STEPS.map((label, index) => (
            <div
              className={`flex-1 rounded-lg px-2 py-2 text-center text-[0.65rem] font-black uppercase tracking-wide ${
                index === step ? "bg-crystal text-white" : index < step ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
              }`}
              key={label}
            >
              {index + 1}. {label}
            </div>
          ))}
        </div>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        {step === 0 ? (
          <div className="space-y-3">
            <Field label="Hakkında *" error={errors.bio}>
              <textarea
                className="zigo-input w-full rounded-xl px-3 py-2 text-sm"
                onChange={(event) => setBio(event.target.value)}
                placeholder="Deneyiminizi, öğretim yaklaşımınızı kısaca anlatın"
                rows={4}
                value={bio}
              />
            </Field>
            <Field label="Profil fotoğrafı URL">
              <input
                className="zigo-input w-full rounded-xl px-3 py-2 text-sm"
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://..."
                type="url"
                value={avatarUrl}
              />
            </Field>
          </div>
        ) : null}

        {step === 1 && initial.kind === "teacher" ? (
          <div className="space-y-3">
            <Field label="CV (PDF URL)">
              <input className="zigo-input w-full rounded-xl px-3 py-2 text-sm" onChange={(e) => setCvUrl(e.target.value)} type="url" value={cvUrl} />
            </Field>
            <Field label="Deneyim yılı *" error={errors.yearsOfExperience}>
              <input className="zigo-input w-full rounded-xl px-3 py-2 text-sm" min={1} onChange={(e) => setYearsOfExperience(e.target.value)} type="number" value={yearsOfExperience} />
            </Field>
            <Field label="Eğitim derecesi *">
              <select className="zigo-input w-full rounded-xl px-3 py-2 text-sm" onChange={(e) => setEducationDegree(e.target.value as EducationDegree)} value={educationDegree}>
                {educationDegreeSchema.options.map((value) => (
                  <option key={value} value={value}>
                    {value === "lisans" ? "Lisans" : value === "yuksek_lisans" ? "Yüksek Lisans" : "Doktora"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Öğretim stili *">
              <select className="zigo-input w-full rounded-xl px-3 py-2 text-sm" onChange={(e) => setTeachingStyle(e.target.value as TeachingStyle)} value={teachingStyle}>
                {teachingStyleSchema.options.map((value) => (
                  <option key={value} value={value}>
                    {value === "visual" ? "Görsel" : value === "practical" ? "Uygulamalı" : "Teorik"}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : null}

        {step === 1 && initial.kind === "institution" ? (
          <div className="space-y-3">
            <Field error={errors.licenseNumber} label="MEB Ruhsat No *">
              <input className="zigo-input w-full rounded-xl px-3 py-2 text-sm" onChange={(e) => setLicenseNumber(e.target.value)} value={licenseNumber} />
            </Field>
            <Field label="Öğrenci kapasitesi *">
              <input className="zigo-input w-full rounded-xl px-3 py-2 text-sm" min={1} onChange={(e) => setCapacity(e.target.value)} type="number" value={capacity} />
            </Field>
            <Field label="Şube sayısı *">
              <input className="zigo-input w-full rounded-xl px-3 py-2 text-sm" min={1} onChange={(e) => setBranchCount(e.target.value)} type="number" value={branchCount} />
            </Field>
            <Field error={errors.accreditation} label="Akreditasyonlar * (virgülle ayırın)">
              <input className="zigo-input w-full rounded-xl px-3 py-2 text-sm" onChange={(e) => setAccreditation(e.target.value)} placeholder="MEB Onaylı, ISO 9001" value={accreditation} />
            </Field>
            <Field error={errors.services} label="Sunulan hizmetler * (virgülle ayırın)">
              <input className="zigo-input w-full rounded-xl px-3 py-2 text-sm" onChange={(e) => setServices(e.target.value)} placeholder="LGS hazırlık, Etüt, Rehberlik" value={services} />
            </Field>
          </div>
        ) : null}

        {step === 1 && initial.kind === "platform" ? (
          <div className="space-y-3">
            <Field label="İçerik sayısı *">
              <input className="zigo-input w-full rounded-xl px-3 py-2 text-sm" min={0} onChange={(e) => setContentCount(e.target.value)} type="number" value={contentCount} />
            </Field>
            <Field label="Kullanıcı tabanı *">
              <input className="zigo-input w-full rounded-xl px-3 py-2 text-sm" min={0} onChange={(e) => setUserBaseSize(e.target.value)} type="number" value={userBaseSize} />
            </Field>
            <Field label="Abonelik modeli *">
              <input className="zigo-input w-full rounded-xl px-3 py-2 text-sm" onChange={(e) => setSubscriptionModel(e.target.value)} value={subscriptionModel} />
            </Field>
            <Field label="Entegrasyon dokümanı URL">
              <input className="zigo-input w-full rounded-xl px-3 py-2 text-sm" onChange={(e) => setIntegrationDocsUrl(e.target.value)} type="url" value={integrationDocsUrl} />
            </Field>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            {initial.kind === "teacher" ? (
              <Field label="Saatlik ücret (₺) *">
                <input className="zigo-input w-full rounded-xl px-3 py-2 text-sm" min={0} onChange={(e) => setHourlyRate(e.target.value)} type="number" value={hourlyRate} />
              </Field>
            ) : null}
            <Field label="Yanıt süresi (dakika) *">
              <input className="zigo-input w-full rounded-xl px-3 py-2 text-sm" min={5} onChange={(e) => setResponseTimeMinutes(e.target.value)} type="number" value={responseTimeMinutes} />
            </Field>
            {initial.kind === "teacher" ? (
              <Field label="Ders kabul oranı (%) *">
                <input className="zigo-input w-full rounded-xl px-3 py-2 text-sm" max={100} min={0} onChange={(e) => setLessonAcceptanceRate(e.target.value)} type="number" value={lessonAcceptanceRate} />
              </Field>
            ) : null}
            <Field label="Hızlı iletişim özeti">
              <textarea className="zigo-input w-full rounded-xl px-3 py-2 text-sm" onChange={(e) => setContactSummary(e.target.value)} placeholder="Örn: Hafta içi 09:00–18:00 arası yanıt veririm" rows={2} value={contactSummary} />
            </Field>
            <Field label="Tanıtım videosu (YouTube / Vimeo URL)">
              <input className="zigo-input w-full rounded-xl px-3 py-2 text-sm" onChange={(e) => setVideoIntroUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." type="url" value={videoIntroUrl} />
            </Field>
            <Field label="Soft skills etiketleri (virgülle)">
              <input className="zigo-input w-full rounded-xl px-3 py-2 text-sm" onChange={(e) => setSoftSkills(e.target.value)} placeholder="Sabırlı, Sınav Odaklı, Oyunlaştırarak Öğretim" value={softSkills} />
            </Field>
            {initial.kind === "teacher" ? (
              <Field label="Sertifikalar (virgülle)">
                <input className="zigo-input w-full rounded-xl px-3 py-2 text-sm" onChange={(e) => setCertificates(e.target.value)} placeholder="Pedagojik Formasyon, STEM Eğitmeni" value={certificates} />
              </Field>
            ) : null}
            <Field label="Müsaitlik durumu *">
              <select className="zigo-input w-full rounded-xl px-3 py-2 text-sm" onChange={(e) => setAvailabilityStatus(e.target.value as "available" | "busy" | "scheduled")} value={availabilityStatus}>
                <option value="available">Şu an müsait</option>
                <option value="scheduled">Planlı müsaitlik</option>
                <option value="busy">Şu an meşgul</option>
              </select>
            </Field>
            {availabilityStatus !== "available" ? (
              <Field label="Müsaitlik notu">
                <input className="zigo-input w-full rounded-xl px-3 py-2 text-sm" onChange={(e) => setAvailabilityNote(e.target.value)} placeholder="Ders için uygun saat: 18:00 sonrası" value={availabilityNote} />
              </Field>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex gap-2">
          {step > 0 ? (
            <button className="tap-scale flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-black text-night" disabled={busy} onClick={() => setStep(step - 1)} type="button">
              Geri
            </button>
          ) : null}
          <button className="tap-scale flex-1 rounded-xl bg-crystal px-4 py-3 text-sm font-black text-white disabled:opacity-60" disabled={busy} onClick={() => void saveStep()} type="button">
            {step === 2 ? (busy ? "Kaydediliyor…" : "Kaydet") : "Devam"}
          </button>
        </div>
        {message ? <p className="mt-3 text-sm font-bold text-slate-600">{message}</p> : null}
      </section>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      {children}
      {error ? <span className="text-xs font-bold text-rose-600">{error}</span> : null}
    </label>
  );
}
