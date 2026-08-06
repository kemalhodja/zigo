"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ProfileFeedbackBox } from "@/components/profile-feedback-box";
import { RegistrationAccountPicker } from "@/components/registration-account-picker";
import { SocialAvatar } from "@/components/social-primitives";
import { isCapacitorClient } from "@/lib/client/capacitor-runtime";
import { pickProfilePhoto } from "@/lib/client/pick-profile-photo";
import { type RegistrationAccountKind, type RequiredSignupOptionId } from "@/lib/domain/registration-account";
import { useMessages } from "@/lib/i18n/locale-context";
import type { UserRole } from "@/lib/supabase/database.types";

type ProfileEditFormProps = {
  initialProfile: {
    fullName: string;
    bio: string;
    avatarUrl: string | null;
    email: string | null;
    role: UserRole;
    accountKind: RegistrationAccountKind;
  };
};

// Map legacy RegistrationAccountKind (includes kurs/okul) to RequiredSignupOptionId
function toRequiredId(kind: RegistrationAccountKind): RequiredSignupOptionId {
  // kurs and okul both map to institution for the new picker
  if (kind === "kurs" || kind === "okul") return "institution";
  return kind as RequiredSignupOptionId;
}

export function ProfileEditForm({ initialProfile }: ProfileEditFormProps) {
  const m = useMessages();
  const pe = m.profileEdit;
  const common = m.common;
  const router = useRouter();

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [bio, setBio] = useState(initialProfile.bio);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialProfile.avatarUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [accountKind, setAccountKind] = useState<RequiredSignupOptionId>(
    toRequiredId(initialProfile.accountKind),
  );

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingKind, setIsSavingKind] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function uploadFile(file: File) {
    setIsUploading(true);
    setMessage("");
    setStatus("idle");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
        data?: { avatarUrl?: string };
      } | null;

      if (!response.ok || !result?.data?.avatarUrl) {
        throw new Error(result?.error || pe.uploadFailed);
      }

      setAvatarUrl(result.data.avatarUrl);
      setStatus("success");
      setMessage(pe.photoReady);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : pe.uploadFailed);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    await uploadFile(file);
  }

  async function handlePick(source: "camera" | "gallery") {
    if (isUploading || isSaving) return;

    if (isCapacitorClient()) {
      const file = await pickProfilePhoto(source);
      if (file) await handleFile(file);
      return;
    }

    if (source === "camera") {
      cameraInputRef.current?.click();
    } else {
      galleryInputRef.current?.click();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSaving || isUploading) return;

    setIsSaving(true);
    setMessage("");
    setStatus("idle");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          bio: bio.trim(),
          avatarUrl,
        }),
      });

      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(result?.error || pe.saveError);
      }

      setStatus("success");
      setMessage(pe.saveSuccess);
      router.refresh();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : pe.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  async function saveAccountKind() {
    if (isSavingKind || toRequiredId(initialProfile.accountKind) === accountKind) return;
    setIsSavingKind(true);
    setMessage("");
    setStatus("idle");

    try {
      const response = await fetch("/api/profile/account-kind", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountKind }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(result?.error || pe.accountKindError);
      }

      setStatus("success");
      setMessage(result?.message || pe.accountKindSaved);
      router.refresh();
      router.push("/onboarding/role-setup");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : pe.accountKindError);
    } finally {
      setIsSavingKind(false);
    }
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleSubmit}
        className="-mx-4 space-y-6 rounded-xl border border-slate-100 bg-white px-4 py-5 shadow-sm"
      >
        <div className="flex flex-col items-center space-y-3 border-b border-slate-100 pb-4">
          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{pe.photoLabel}</label>

          <SocialAvatar
            accent="from-crystal via-fuchsia-500 to-rose-400"
            className="story-ring size-24 text-4xl shadow-md"
            label={fullName || "User"}
            imageUrl={previewUrl || avatarUrl}
          />

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />

          <div className="grid w-full max-w-sm grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void handlePick("camera")}
              disabled={isUploading || isSaving}
              className="tap-scale rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {isUploading ? pe.uploading : pe.cameraButton}
            </button>
            <button
              type="button"
              onClick={() => void handlePick("gallery")}
              disabled={isUploading || isSaving}
              className="tap-scale rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {isUploading ? pe.uploading : pe.galleryButton}
            </button>
          </div>
          <p className="text-center text-[0.7rem] font-semibold text-slate-500">{pe.photoHint}</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="full-name" className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            {pe.fullNameLabel}
          </label>
          <input
            id="full-name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isSaving}
            placeholder={pe.fullNamePlaceholder}
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-crystal focus:ring-2 focus:ring-crystal focus:ring-offset-2"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="bio" className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              {pe.bioLabel}
            </label>
            <span className="text-[10px] font-bold text-slate-400">{bio.length} / 500</span>
          </div>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={isSaving}
            maxLength={500}
            rows={4}
            placeholder={pe.bioPlaceholder || "Biyografin, uzmanlık alanların veya sosyal medya linklerin (örn: https://youtube.com/@kanalin)"}
            className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-crystal focus:ring-2 focus:ring-crystal focus:ring-offset-2"
          />
          <p className="text-[0.7rem] font-semibold text-slate-500">
            💡 İpucu: Biyografine Instagram, YouTube veya web sitenin bağlantılarını (`https://...`) ekleyebilirsin. Profilinde tıklanabilir sayfa butonları olarak görünecektir.
          </p>
        </div>

        <div className="space-y-2 rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{pe.emailLabel}</p>
          <p className="text-sm font-bold text-night">{initialProfile.email || pe.emailMissing}</p>
          <Link className="inline-block text-xs font-black text-crystal" href="/auth/forgot-password">
            {pe.changePassword}
          </Link>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.push("/profile")}
            disabled={isSaving}
            className="tap-scale flex-1 rounded-lg border border-slate-200 bg-white py-3.5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {common.cancel}
          </button>
          <button
            type="submit"
            disabled={isSaving || isUploading || !fullName.trim()}
            className="tap-scale zigo-cta flex-1 rounded-lg py-3.5 text-sm font-black text-white transition hover:brightness-95 disabled:opacity-60"
          >
            {isSaving ? pe.saving : pe.saveButton}
          </button>
        </div>
      </form>

      <section className="-mx-4 space-y-3 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">{pe.accountKindLabel}</p>
          <h3 className="mt-1 text-base font-black text-night">{pe.accountKindTitle}</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-amber-900">{pe.accountKindDesc}</p>
        </div>
        <RegistrationAccountPicker
          onChange={setAccountKind}
          value={accountKind}
        />
        <button
          type="button"
          onClick={() => void saveAccountKind()}
          disabled={isSavingKind || toRequiredId(initialProfile.accountKind) === accountKind}
          className="tap-scale w-full rounded-lg bg-night px-4 py-3 text-sm font-black text-white disabled:opacity-50"
        >
          {isSavingKind ? pe.saving : pe.accountKindSave}
        </button>
      </section>

      <ProfileFeedbackBox />

      {message ? (
        <p
          className={`rounded-lg px-4 py-3 text-center text-sm font-bold ${
            status === "success" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          }`}
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
