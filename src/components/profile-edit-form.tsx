"use client";

import { useRouter } from "next/navigation";
import { useRef,useState } from "react";

import { SocialAvatar } from "@/components/social-primitives";
import { useMessages } from "@/lib/i18n/locale-context";

type ProfileEditFormProps = {
  initialProfile: {
    fullName: string;
    bio: string;
    avatarUrl: string | null;
  };
};

export function ProfileEditForm({ initialProfile }: ProfileEditFormProps) {
  const m = useMessages();
  const pe = m.profileEdit;
  const common = m.common;
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [bio, setBio] = useState(initialProfile.bio);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialProfile.avatarUrl);

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

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

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || pe.uploadFailed);
      }

      setAvatarUrl(result.data.avatarUrl);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : pe.uploadFailed);
    } finally {
      setIsUploading(false);
    }
  }

  function triggerFileInput() {
    fileInputRef.current?.click();
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
          avatarUrl: avatarUrl,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || pe.saveError);
      }

      setStatus("success");
      setMessage(pe.saveSuccess);
      router.refresh();

      setTimeout(() => {
        router.push("/profile");
      }, 1000);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : pe.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="-mx-4 space-y-6 bg-white px-4 py-5 rounded-xl shadow-sm border border-slate-100">
      <div className="flex flex-col items-center space-y-3 pb-2 border-b border-slate-100">
        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{pe.photoLabel}</label>
        
        <div className="relative group cursor-pointer" onClick={triggerFileInput}>
          <SocialAvatar
            accent="from-crystal via-fuchsia-500 to-rose-400"
            className="story-ring size-24 text-4xl shadow-md"
            label={fullName || "User"}
            imageUrl={avatarUrl}
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200">
            <svg className="size-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path d="M15 13.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isUploading || isSaving}
        />

        <button
          type="button"
          onClick={triggerFileInput}
          disabled={isUploading || isSaving}
          className="tap-scale px-4 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition text-xs font-black text-slate-700 disabled:opacity-60"
        >
          {isUploading ? pe.uploading : pe.uploadButton}
        </button>
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
          placeholder="Ad Soyad"
          className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-crystal focus:ring-2 focus:ring-crystal focus:ring-offset-2"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="bio" className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            {pe.bioLabel}
          </label>
          <span className="text-[10px] font-bold text-slate-400">
            {bio.length} / 500
          </span>
        </div>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          disabled={isSaving}
          maxLength={500}
          rows={4}
          placeholder="Kendinizden bahsedin..."
          className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-crystal focus:ring-2 focus:ring-crystal focus:ring-offset-2 resize-none"
        />
      </div>

      <div className="pt-2 flex gap-2">
        <button
          type="button"
          onClick={() => router.push("/profile")}
          disabled={isSaving}
          className="tap-scale flex-1 rounded-lg border border-slate-200 bg-white py-3.5 text-sm font-black text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
        >
          {common.cancel}
        </button>
        <button
          type="submit"
          disabled={isSaving || isUploading || !fullName.trim()}
          className="tap-scale flex-1 zigo-cta rounded-lg py-3.5 text-sm font-black text-white hover:brightness-95 transition disabled:opacity-60"
        >
          {isSaving ? pe.saving : pe.saveButton}
        </button>
      </div>

      {message && (
        <p
          className={`rounded-lg px-4 py-3 text-center text-sm font-bold ${
            status === "success"
              ? "bg-emerald-50 text-emerald-600"
              : "bg-rose-50 text-rose-600"
          }`}
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      )}
    </form>
  );
}
