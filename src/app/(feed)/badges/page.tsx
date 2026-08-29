import { MedalIcon } from "lucide-react";

export default function BadgesPage() {
  return (
    <div className="py-6 px-4">
      <div className="zigo-empty-hero flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 mb-5 backdrop-blur-md border border-white/20">
          <MedalIcon className="h-8 w-8 text-white" />
        </div>
        <h1 className="zigo-page-title text-white">Rozetlerim</h1>
        <p className="mt-3 text-white/70 max-w-xs leading-relaxed font-medium">
          Oyunlaştırma modülleri ve rozet kazanım sistemi çok yakında burada olacak. Öğrenerek ve yarışarak kazandığın tüm rozetleri buradan sergileyebileceksin.
        </p>
      </div>
    </div>
  );
}
