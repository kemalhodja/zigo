"use client";

import React, { useState } from "react";

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB Limit

export interface CreatePostScreenProps {
  onSuccess?: () => void;
  defaultAreaId?: number;
}

export function CreatePostScreen({ onSuccess, defaultAreaId = 1 }: CreatePostScreenProps) {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [caption, setCaption] = useState<string>("");
  const [areaId, setAreaId] = useState<number>(defaultAreaId);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError(null);
    setSuccessMessage(null);

    if (!file) {
      setMediaFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const errorMsg = `Dosya boyutu 100 MB sınırını aşıyor (${sizeMB} MB). Lütfen daha küçük bir dosya seçin.`;
      setError(errorMsg);
      setMediaFile(null);
      event.target.value = "";
      return;
    }

    setMediaFile(file);
  }

  function resetForm() {
    setMediaFile(null);
    setCaption("");
    setError(null);
  }

  async function handlePublish(event: React.FormEvent) {
    event.preventDefault();

    if (!caption.trim()) {
      setError("Lütfen gönderiniz için bir açıklama yazın.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let mediaUrl = "";
      let mediaType: "image" | "video" = "image";

      // 1. Medya dosyası varsa önce yükleme API'sine gönder
      if (mediaFile) {
        mediaType = mediaFile.type.startsWith("video/") ? "video" : "image";
        const formData = new FormData();
        formData.append("file", mediaFile);

        const uploadRes = await fetch("/api/social/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json().catch(() => null);

        if (!uploadRes.ok) {
          throw new Error(uploadData?.error ?? "Medya yükleme işlemi başarısız oldu.");
        }

        mediaUrl = uploadData?.data?.mediaUrl ?? "";
      }

      // 2. Gönderiyi veritabanına kaydet
      const postRes = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: caption.trim(),
          mediaUrl,
          mediaType,
          areaId,
          isReel: mediaType === "video",
        }),
      });

      const postData = await postRes.json().catch(() => null);

      if (!postRes.ok) {
        throw new Error(postData?.error ?? "Gönderi yayınlanırken bir hata oluştu.");
      }

      setSuccessMessage("Gönderiniz başarıyla yayınlandı! 🎉");
      resetForm();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-slate-900">Gönderi Paylaş</h2>

      <form onSubmit={handlePublish} className="space-y-4">
        {/* Medya Seçimi */}
        <div>
          <label htmlFor="media-upload-input" className="mb-1 block text-xs font-semibold text-slate-600">
            Fotoğraf veya Video Seç (Maks. 100 MB)
          </label>
          <input
            id="media-upload-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
            onChange={handleFileChange}
            disabled={isLoading}
            className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-medium text-slate-700 transition file:mr-3 file:rounded-md file:border-0 file:bg-violet-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-violet-700 disabled:opacity-50"
          />
          {mediaFile && (
            <p className="mt-1 text-xs text-emerald-600 font-medium">
              Seçilen Dosya: {mediaFile.name} ({(mediaFile.size / (1024 * 1024)).toFixed(1)} MB)
            </p>
          )}
        </div>

        {/* Açıklama Metni */}
        <div>
          <label htmlFor="caption-textarea" className="mb-1 block text-xs font-semibold text-slate-600">
            Açıklama <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="caption-textarea"
            rows={4}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={isLoading}
            placeholder="Ne düşünüyorsun? Açıklama yaz..."
            className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
          />
        </div>

        {/* Hata Uyarısı */}
        {error && (
          <div className="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-600 border border-rose-200">
            ⚠️ {error}
          </div>
        )}

        {/* Başarı Uyarısı */}
        {successMessage && (
          <div className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200">
            {successMessage}
          </div>
        )}

        {/* Yayınla Butonu */}
        <button
          type="submit"
          disabled={isLoading || !caption.trim()}
          className="w-full rounded-lg bg-violet-600 py-3 text-sm font-bold text-white transition hover:bg-violet-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="size-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Yükleniyor...
            </span>
          ) : (
            "Gönderiyi Yayınla"
          )}
        </button>
      </form>
    </div>
  );
}
