import { BookmarkIcon } from "lucide-react";

export default function SavedPage() {
  return (
    <div className="py-6 px-4">
      <div className="zigo-empty-hero flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 mb-5 backdrop-blur-md border border-white/20">
          <BookmarkIcon className="h-8 w-8 text-white" />
        </div>
        <h1 className="zigo-page-title text-white">Kayıtlı Gönderiler</h1>
        <p className="mt-3 text-white/70 max-w-xs leading-relaxed font-medium">
          Kaydettiğiniz tüm ders notları, reels videoları ve gönderiler burada listelenecek. Yeni özellik çok yakında yayında.
        </p>
      </div>
    </div>
  );
}
