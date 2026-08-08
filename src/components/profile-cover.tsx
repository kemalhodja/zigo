"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type ProfileCoverProps = {
  initialCoverUrl?: string | null;
  isEditable?: boolean;
  isVerified?: boolean;
  verifiedBadgeLabel?: string;
};

export function ProfileCover({
  initialCoverUrl,
  isEditable = false,
  isVerified = false,
  verifiedBadgeLabel = "✓ Doğrulanmış Öğretmen",
}: ProfileCoverProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local blob preview
    const localPreview = URL.createObjectURL(file);
    setCoverUrl(localPreview);
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", "cover");

    try {
      const response = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json().catch(() => null)) as {
        error?: string;
        data?: { coverUrl?: string; imageUrl?: string };
      } | null;

      if (!response.ok || !(result?.data?.coverUrl || result?.data?.imageUrl)) {
        throw new Error(result?.error || "Kapak fotoğrafı yüklenemedi.");
      }

      const uploadedUrl = result.data.coverUrl || result.data.imageUrl || localPreview;
      setCoverUrl(uploadedUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme hatası.");
      // Revert preview on failure
      setCoverUrl(initialCoverUrl ?? null);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  async function handleResetCover() {
    if (isUploading) return;
    setCoverUrl(null);
    setIsUploading(true);
    setError(null);

    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverUrl: null }),
      });
      router.refresh();
    } catch {
      // Ignore reset failure
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="group relative h-32 w-full overflow-hidden bg-gradient-to-br from-crystal via-fuchsia-500 to-rose-400 sm:h-40">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.25),transparent_60%)]" />

      {/* Render uploaded custom cover image */}
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt="Kapak fotoğrafı"
          className="h-full w-full object-cover transition-opacity duration-300"
        />
      ) : null}

      {/* Loading indicator */}
      {isUploading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <span className="flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-black text-night shadow-lg">
            <svg aria-hidden="true" className="size-4 animate-spin text-crystal" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Kapak Güncelleniyor…
          </span>
        </div>
      ) : null}

      {/* Verified badge */}
      {isVerified ? (
        <span className="absolute left-3 top-3 rounded-full bg-white/20 px-2.5 py-1 text-[0.6rem] font-black text-white backdrop-blur-md">
          {verifiedBadgeLabel}
        </span>
      ) : null}

      {/* Edit controls for profile owner */}
      {isEditable ? (
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="tap-scale flex items-center gap-1.5 rounded-full border border-white/40 bg-black/30 px-3 py-1.5 text-[0.68rem] font-black text-white backdrop-blur-md transition hover:bg-black/50 hover:border-white disabled:opacity-50"
            title="Kapak fotoğrafını değiştir veya yükle"
          >
            <svg aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>{coverUrl ? "Kapağı Değiştir" : "Kapak Fotoğrafı Ekle"}</span>
          </button>

          {coverUrl ? (
            <button
              type="button"
              onClick={handleResetCover}
              disabled={isUploading}
              className="tap-scale flex size-7 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur-md hover:bg-rose-600 transition"
              title="Varsayılan renge dön"
            >
              ✕
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="absolute bottom-2 left-3 right-3 rounded-lg bg-rose-600/90 px-3 py-1 text-center text-[0.65rem] font-bold text-white backdrop-blur">
          {error}
        </div>
      ) : null}
    </div>
  );
}
