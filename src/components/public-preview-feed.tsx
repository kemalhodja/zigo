"use client";

import Link from "next/link";

import { trackEvent } from "@/lib/client/analytics";

type PreviewPost = {
  author: string;
  role: string;
  badge: string;
  text: string;
  likes: number;
  comments: number;
  accent: string;
};

const SAMPLE_POSTS: PreviewPost[] = [
  {
    author: "Ayşe H.",
    role: "Doğrulanmış Öğretmen",
    badge: "✅",
    text: "Denklem çözerken işaret hatası yapıyorsan: terim taşırken köşeye küçük ok çiz. 30 gün sonra otomatikleşiyor. Deneyenler farkı 1 haftada görüyor 👀",
    likes: 248,
    comments: 36,
    accent: "from-rose-500 to-pink-600",
  },
  {
    author: "Mert K.",
    role: "12. sınıf",
    badge: "🔥",
    text: "21 gün streak! Odak odasında her akşam 3 pomodoro. YKS'ye 180 gün kala ilk kez düzenli çalışıyorum.",
    likes: 512,
    comments: 89,
    accent: "from-indigo-500 to-blue-600",
  },
  {
    author: "Zigo Oyun",
    role: "Matematik Ustası",
    badge: "🧮",
    text: "Bu haftanın lideri 8. sınıf MEB müfredat modunda 1.240 puanla belli oldu. Sıradaki turnuvada yerini al!",
    likes: 173,
    comments: 41,
    accent: "from-emerald-500 to-teal-600",
  },
];

const FEATURES = [
  { icon: "🎯", title: "Odak Odaları", desc: "Herkesin sayacı aynı anda akan canlı çalışma odaları" },
  { icon: "🎮", title: "Öğrenen Oyunlar", desc: "MEB kazanımlarına uygun matematik, kelime ve hafıza oyunları" },
  { icon: "🏆", title: "Puan & Liga", desc: "Çalıştıkça puan topla, lig yüksel, ödül dükkanında harca" },
];

export function PublicPreviewFeed() {
  return (
    <div className="flex flex-col pb-4 bg-white md:bg-transparent md:gap-6">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-6 py-14 text-center text-white">
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-black/10 blur-2xl" />
        <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-white/70">
          zigo.app
        </p>
        <h1 className="mx-auto max-w-md text-3xl font-black leading-tight sm:text-4xl">
          Ders çalışanların sosyal ağı
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm font-medium text-white/85">
          Birlikte çalış, puan kazan, doğrulanmış öğretmenlerden öğren. Velin de seni takip edebilir.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/auth?next=/onboarding"
            onClick={() => trackEvent("preview_cta_clicked", { spot: "hero" })}
            className="tap-scale w-full max-w-xs rounded-2xl bg-white px-8 py-3.5 text-sm font-black text-indigo-700 shadow-xl transition hover:brightness-105 sm:w-auto"
          >
            Ücretsiz Katıl
          </Link>
          <Link
            href="/about"
            className="w-full max-w-xs rounded-2xl border border-white/40 px-8 py-3.5 text-sm font-black text-white transition hover:bg-white/10 sm:w-auto"
          >
            Nasıl çalışır?
          </Link>
        </div>
      </section>

      {/* Feature strip */}
      <section className="grid grid-cols-3 gap-2 px-4 pt-5 sm:gap-4 md:px-0">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm sm:p-5">
            <p className="text-2xl">{f.icon}</p>
            <p className="mt-1 text-[0.72rem] font-black text-night sm:text-sm">{f.title}</p>
            <p className="mt-0.5 hidden text-xs font-medium text-slate-500 sm:block">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Sample feed */}
      <section className="px-4 pt-6 md:px-0">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
          Akıştan bir görünüm · örnek içerik
        </p>
        <div className="space-y-3">
          {SAMPLE_POSTS.map((post) => (
            <article key={post.author} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${post.accent} text-sm font-black text-white`}>
                  {post.author.slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-night">
                    {post.author} <span className="text-slate-400">{post.badge}</span>
                  </p>
                  <p className="text-xs font-semibold text-slate-400">{post.role}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{post.text}</p>
              <div className="mt-3 flex items-center gap-4 text-xs font-bold text-slate-400">
                <span>❤️ {post.likes}</span>
                <span>💬 {post.comments}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-600 p-8 text-center text-white shadow-lg">
          <h2 className="text-xl font-black">Senin sıran ne zaman?</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm font-medium text-indigo-100">
            30 saniyede hesabını oluştur, ilk odak bloğuna bugün katıl.
          </p>
          <Link
            href="/auth?next=/onboarding"
            onClick={() => trackEvent("preview_cta_clicked", { spot: "footer" })}
            className="tap-scale mt-5 inline-block rounded-2xl bg-white px-10 py-3.5 text-sm font-black text-indigo-700 shadow-xl transition hover:brightness-105"
          >
            Hemen Başla — Ücretsiz
          </Link>
        </div>
      </section>
    </div>
  );
}
