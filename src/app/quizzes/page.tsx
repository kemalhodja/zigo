import Link from "next/link";

import { getCurrentProfile } from "@/lib/domain/profiles";
import {
  listApprovedUserQuizzes,
  listOwnUserQuizzes,
} from "@/lib/domain/user-quizzes";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Quizler | Zigo" };
export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    approved: { label: "✅ Yayında", cls: "bg-emerald-50 text-emerald-600" },
    pending: { label: "⏳ Onay bekliyor", cls: "bg-amber-50 text-amber-600" },
    rejected: { label: "❌ Reddedildi", cls: "bg-rose-50 text-rose-600" },
  };
  const item = map[status] ?? map.pending;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-black ${item.cls}`}>{item.label}</span>
  );
}

export default async function UserQuizzesPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  const [approved, mine] = await Promise.all([
    listApprovedUserQuizzes(supabase),
    profile ? listOwnUserQuizzes(supabase, profile.id) : Promise.resolve([]),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-md">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100"
        >
          ←
        </Link>
        <h1 className="text-lg font-bold text-night">Quiz Arena</h1>
        <div className="w-10" />
      </header>

      <main className="mx-auto max-w-xl space-y-6 p-4">
        <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 p-5 text-white shadow-md">
          <h2 className="text-lg font-black">Kendi quizini yap, herkesle yarış 🏆</h2>
          <p className="mt-1 text-sm font-medium text-white/85">
            En az 3 soru ekle, yayınlayalım. Arkadaşlarını meydan oku!
          </p>
          <Link
            href="/quizzes/create"
            className="tap-scale mt-4 inline-block rounded-xl bg-white px-6 py-2.5 text-sm font-black text-purple-700 shadow transition hover:brightness-105"
          >
            + Quiz Oluştur
          </Link>
        </div>

        {profile && mine.length > 0 ? (
          <section>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">
              Benim Quizlerim
            </h3>
            <div className="space-y-2">
              {mine.map((quiz) => (
                <Link
                  key={quiz.id}
                  href={`/quizzes/${quiz.id}`}
                  className="block rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-bold text-night">{quiz.title}</p>
                    <StatusBadge status={quiz.status} />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    👁️ {quiz.play_count} oynanma ·{" "}
                    {new Date(quiz.created_at).toLocaleDateString("tr-TR")}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">
            Öne Çıkanlar
          </h3>
          {approved.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-400">
              Henüz yayınlanmış quiz yok. İlk yapan sen ol!
            </p>
          ) : (
            <div className="space-y-2">
              {approved.map((quiz) => (
                <Link
                  key={quiz.id}
                  href={`/quizzes/${quiz.id}`}
                  className="block rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <p className="truncate font-bold text-night">{quiz.title}</p>
                  {quiz.description ? (
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                      {quiz.description}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    👁️ {quiz.play_count} oynanma
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
