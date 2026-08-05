import Link from "next/link";
import { notFound } from "next/navigation";

import { SocialMediaFrame } from "@/components/social-media-frame";
import { hasSupabaseEnv } from "@/lib/config";
import { searchSocialPosts } from "@/lib/domain/social";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

type TagPageProps = {
  params: Promise<{ tag: string }>;
};

const GRADIENT_CYCLE = [
  "from-crystal to-fuchsia-500",
  "from-emerald-500 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-sky-500 to-indigo-500",
  "from-pink-500 to-rose-500",
  "from-violet-600 to-purple-500",
];

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);

  if (!decodedTag || decodedTag.length < 1) notFound();

  const m = await getServerMessages();

  let posts: Awaited<ReturnType<typeof searchSocialPosts>> = [];

  if (hasSupabaseEnv()) {
    try {
      const supabase = await createClient();
      const profile = await getCurrentProfile(supabase);
      // Search posts that contain the hashtag in their caption
      posts = await searchSocialPosts(supabase, decodedTag, profile?.id);
      // Filter to only posts that actually contain the hashtag
      const hashPattern = new RegExp(`#${decodedTag}\\b`, "i");
      posts = posts.filter((p) => hashPattern.test(p.caption));
    } catch {
      posts = [];
    }
  }

  const postCount = posts.length;

  return (
    <div className="space-y-0 pb-3">
      {/* Header */}
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-4">
        <div className="flex items-center gap-3">
          <Link
            aria-label="Geri"
            className="tap-scale flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-night"
            href="/explore"
          >
            <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-crystal to-berry text-xl font-black text-white shadow-md shadow-crystal/20">
                #
              </span>
              <div>
                <h1 className="text-lg font-black text-night">#{decodedTag}</h1>
                <p className="text-xs font-semibold text-slate-500">
                  {postCount > 0
                    ? `${postCount.toLocaleString("tr-TR")} gönderi`
                    : "Henüz gönderi yok"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick action chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            className="rounded-full bg-crystal px-3 py-1.5 text-xs font-black text-white"
            href={`/explore?q=${encodeURIComponent(decodedTag)}`}
          >
            Keşfet&apos;te Ara
          </Link>
          <Link
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-night"
            href={`/create?caption=${encodeURIComponent(`#${decodedTag} `)}`}
          >
            Bu Etiketle Paylaş
          </Link>
        </div>
      </section>

      {/* Post Grid */}
      {postCount === 0 ? (
        <section className="-mx-4 bg-white px-6 py-14 text-center">
          <span className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-crystal to-berry shadow-lg shadow-crystal/20">
            <svg aria-hidden="true" className="size-9 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </span>
          <h2 className="mt-5 text-xl font-black text-night">#{decodedTag}</h2>
          <p className="mx-auto mt-2 max-w-64 text-sm font-semibold leading-6 text-slate-500">
            Bu etiketi kullanan ilk gönderiyi sen oluştur!
          </p>
          <Link
            className="tap-scale zigo-cta mt-6 inline-flex rounded-xl px-5 py-3 text-sm font-black text-white"
            href={`/create?caption=${encodeURIComponent(`#${decodedTag} `)}`}
          >
            Gönderi Oluştur
          </Link>
        </section>
      ) : (
        <section className="-mx-4 bg-white">
          <div className="border-b border-slate-100 px-4 py-2.5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">Gönderiler</p>
            <h2 className="mt-1 text-base font-black text-night">#{decodedTag} ile paylaşılanlar</h2>
          </div>
          <div className="grid auto-rows-[8rem] grid-cols-3 gap-px">
            {posts.map((post, index) => (
              <Link
                className="group relative block overflow-hidden"
                href={`/post/${post.id}`}
                key={post.id}
              >
                <SocialMediaFrame
                  alt={post.caption.slice(0, 60)}
                  className="h-full"
                  gradient={GRADIENT_CYCLE[index % GRADIENT_CYCLE.length]}
                  mediaType={post.media_type}
                  mediaUrl={post.media_url}
                  scene={index % 3 === 0 ? "math" : index % 3 === 1 ? "science" : "coding"}
                >
                  <div className="flex items-start justify-between">
                    {post.is_reel || post.media_type === "video" ? (
                      <span className="flex size-6 items-center justify-center rounded-md bg-black/30 backdrop-blur">
                        <svg aria-hidden="true" className="ml-0.5 size-2.5 fill-white" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    ) : <span />}
                  </div>
                  <div />
                </SocialMediaFrame>
                {/* hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100">
                  <span className="flex items-center gap-1 text-xs font-black text-white">
                    <svg aria-hidden="true" className="size-3.5 fill-white" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    {post.likes_count.toLocaleString("tr-TR")}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-black text-white">
                    <svg aria-hidden="true" className="size-3.5 fill-white" viewBox="0 0 24 24">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {post.comments_count.toLocaleString("tr-TR")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer: Related hashtags */}
      <section className="-mx-4 border-t border-slate-100 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">İlgili Konular</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Matematik", "Fen", "Türkçe", "İngilizce", "LGS", "YKS", "Kodlama", "Sanat"].map((topic) => (
            <Link
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-night transition hover:bg-crystal hover:text-white"
              href={`/tag/${encodeURIComponent(topic)}`}
              key={topic}
            >
              #{topic}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
