
import { BackButton } from "@/components/back-button";

export const metadata = {
  title: "Çalışma Odaları | Zigo",
};

export default function StudyRoomsPage() {
  const mockRooms = [
    { id: "room-1", name: "LGS Matematik Kampı", type: "voice", participants: 8, max: 10 },
    { id: "room-2", name: "Sessiz Odaklanma (Pomodoro)", type: "silent", participants: 15, max: 50 },
    { id: "room-3", name: "Tarih Soru Çözümü", type: "voice", participants: 4, max: 10 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-md">
        <BackButton className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100" fallbackHref="/learn" />
        <h1 className="text-lg font-bold text-night">Çalışma Odaları</h1>
        <div className="w-10" />
      </header>

      <main className="p-4">
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-md">
          <h2 className="mb-2 text-xl font-black">Birlikte Odaklanın! 🚀</h2>
          <p className="text-sm font-medium text-indigo-100">
            Sesli veya sessiz çalışma odalarına katılarak arkadaşlarınızla motive olun ve Zigo puanları kazanın.
            (Şu anda simülasyon modundadır)
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Aktif Odalar</h3>
          {mockRooms.map((room) => (
            <div key={room.id} className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-night">{room.name}</h4>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${room.type === "voice" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {room.type === "voice" ? "🎙️ Sesli" : "🤫 Sessiz"}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {room.participants} / {room.max} Katılımcı
                </p>
              </div>
              <button
                className="w-full rounded-xl bg-crystal py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-crystal-dark sm:w-auto sm:px-6"
                onClick={() => alert(`Simülasyon: ${room.name} odasına bağlanılıyor... \n(LiveKit altyapısı bekleniyor)`)}
              >
                Odaya Katıl
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
