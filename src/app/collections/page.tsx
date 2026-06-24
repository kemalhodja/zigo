import Link from "next/link";

import { SocialMediaFrame } from "@/components/social-media-frame";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getSavedSocialPosts } from "@/lib/domain/social";
import { getServerMessages } from "@/lib/i18n/server";
import type { Messages } from "@/lib/i18n/types";
import type { SocialPostRow } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type CollectionsPageProps = {
  searchParams: Promise<{ folder?: string; q?: string }>;
};

type CollectionFolderId = "all" | "reels" | "lessons" | "teachers";

function getCollectionFolders(c: Messages["collectionsPage"]) {
  return [
    { id: "all" as const, label: c.folderAll, description: c.folderAllDesc },
    { id: "reels" as const, label: c.folderReels, description: c.folderReelsDesc },
    { id: "lessons" as const, label: c.folderLessons, description: c.folderLessonsDesc },
    { id: "teachers" as const, label: c.folderTeachers, description: c.folderTeachersDesc },
  ];
}

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  const m = await getServerMessages();
  const c = m.collectionsPage;
  const params = await searchParams;
  const activeFolder = getActiveFolder(params.folder, c);
  const query = params.q?.trim() ?? "";
  const { isSignedOut, posts } = await getSavedPosts();
  const folderPosts = filterSavedPosts(posts, activeFolder);
  const filteredPosts = searchSavedPosts(folderPosts, query);
  const collectionFolders = getCollectionFolders(c);
  const activeFolderMeta = collectionFolders.find((folder) => folder.id === activeFolder) ?? collectionFolders[0];

  return (
    <div className="space-y-4 pb-3">
      <section className="-mx-4 flex items-center justify-between border-b border-pink-100 bg-white px-4 pb-3">
        <div>
          <h1 className="text-2xl font-black text-night">{c.title}</h1>
          <p className="mt-1 text-xs font-bold text-slate-500">{c.onlyYouSee}</p>
        </div>
        <span className="rounded-lg bg-gradient-to-r from-crystal to-berry px-3 py-1 text-xs font-black text-white">
          {posts.length}
        </span>
      </section>

      {posts.length > 0 ? (
        <section className="-mx-4 space-y-3 bg-white px-4 pb-3">
          <form action="/collections" className="relative">
            {activeFolder !== "all" ? <input name="folder" type="hidden" value={activeFolder} /> : null}
            <svg aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
            <input
              className="w-full rounded-lg bg-slate-100 px-9 py-2.5 text-sm font-bold text-night outline-none focus:bg-white focus:ring-2 focus:ring-violet-100"
              defaultValue={query}
              name="q"
              placeholder={c.searchPlaceholder}
            />
          </form>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {collectionFolders.map((folder) => {
              const count = filterSavedPosts(posts, folder.id).length;
              const isActive = folder.id === activeFolder;
              return (
                <Link
                  className={`shrink-0 rounded-lg border px-3 py-2 ${
                    isActive
                      ? "border-transparent bg-gradient-to-r from-crystal via-berry to-aqua text-white"
                      : "border-pink-100 bg-white text-slate-700"
                  }`}
                  href={getCollectionHref(folder.id, query)}
                  key={folder.id}
                >
                  <span className="block text-xs font-black">{folder.label}</span>
                  <span className={`mt-0.5 block text-zigo-caption font-semibold ${isActive ? "text-white/80" : "text-slate-500"}`}>
                    {c.savedCount.replace("{count}", String(count))}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {posts.length === 0 ? (
        <section className="-mx-4 bg-white px-6 py-14 text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-lg bg-gradient-to-br from-crystal via-berry to-aqua text-white">
            <svg aria-hidden="true" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 3h12v18l-6-4-6 4z" />
            </svg>
          </span>
          <h2 className="mt-4 text-lg font-black text-night">
            {isSignedOut ? c.signInSave : c.noSaved}
          </h2>
          <p className="mx-auto mt-2 max-w-64 text-sm font-semibold leading-6 text-slate-500">
            {isSignedOut
              ? c.signInSave
              : c.noSaved}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link className="tap-scale rounded-lg bg-gradient-to-r from-crystal to-berry px-4 py-3 text-sm font-black text-white" href={isSignedOut ? "/auth?next=/collections" : "/explore"}>
              {isSignedOut ? m.auth.signIn : c.explore}
            </Link>
            <Link className="tap-scale rounded-lg bg-gradient-to-r from-aqua to-mint px-4 py-3 text-sm font-black text-white" href={isSignedOut ? "/" : "/micro"}>
              {isSignedOut ? m.nav.home : m.nav.micro}
            </Link>
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-night">{activeFolderMeta.label}</h2>
              <p className="mt-0.5 text-xs font-bold text-slate-500">
                {query
                  ? c.searchResultsIn.replace("{query}", query).replace("{folder}", activeFolderMeta.label)
                  : activeFolderMeta.description}
              </p>
            </div>
            <span className="rounded-lg bg-violet-50 px-3 py-1 text-xs font-black text-crystal">
              {c.privateFolder}
            </span>
          </div>
          {filteredPosts.length === 0 ? (
            <div className="-mx-4 bg-white px-6 py-12 text-center">
              <p className="text-sm font-black text-night">
                {query ? c.noResults : c.noFolderSaves}
              </p>
              <p className="mx-auto mt-1 max-w-64 text-sm font-bold leading-6 text-slate-500">
                {query ? c.clearSearch : c.discoverPosts}
              </p>
              <Link className="tap-scale mt-4 inline-flex zigo-cta tap-scale rounded-lg px-5 py-3 text-sm font-black text-white" href={query ? getCollectionHref(activeFolder, "") : "/explore"}>
                {query ? c.clearSearch : c.discoverPosts}
              </Link>
            </div>
          ) : (
            <div className="-mx-4 grid grid-cols-3 gap-px bg-white">
            {filteredPosts.map((post, index) => (
              <Link className="block text-[0.68rem] font-black text-white" href={`/post/${post.id}`} key={post.id}>
                <SocialMediaFrame
                  className="aspect-square media-polish"
                  gradient={
                    index % 3 === 0
                      ? "from-crystal to-fuchsia-500"
                      : index % 3 === 1
                        ? "from-emerald-500 to-teal-500"
                        : "from-amber-400 to-orange-500"
                  }
                  mediaType={post.media_type}
                  mediaUrl={post.media_url}
                >
                  <div className="flex justify-end">
                    {post.media_type === "video" || post.is_reel ? (
                      <span className="flex size-7 items-center justify-center rounded-lg bg-black/35 backdrop-blur">
                        <svg aria-hidden="true" className="ml-0.5 size-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    ) : null}
                  </div>
                  <div />
                </SocialMediaFrame>
              </Link>
            ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

async function getSavedPosts(): Promise<{ isSignedOut: boolean; posts: SocialPostRow[] }> {
  if (!hasSupabaseEnv()) return { isSignedOut: true, posts: [] };

  const previewFallback = { isSignedOut: true, posts: [] as SocialPostRow[] };

  return withSupabaseFallback(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { isSignedOut: true, posts: [] };

  return { isSignedOut: false, posts: await getSavedSocialPosts(supabase, profile.id) };
  }, previewFallback);
}

function getActiveFolder(folder: string | undefined, c: Messages["collectionsPage"]): CollectionFolderId {
  const folders = getCollectionFolders(c);
  return folders.some((item) => item.id === folder) ? (folder as CollectionFolderId) : "all";
}

function filterSavedPosts(posts: SocialPostRow[], folder: CollectionFolderId) {
  if (folder === "reels") return posts.filter((post) => post.is_reel || post.media_type === "video");
  if (folder === "lessons") return posts.filter((post) => !post.is_reel && post.media_type !== "video");
  if (folder === "teachers") return posts;
  return posts;
}

function searchSavedPosts(posts: SocialPostRow[], query: string) {
  if (!query) return posts;
  const normalizedQuery = query.toLowerCase();
  return posts.filter((post) => post.caption.toLowerCase().includes(normalizedQuery));
}

function getCollectionHref(folder: CollectionFolderId, query: string) {
  const search = new URLSearchParams();
  if (folder !== "all") search.set("folder", folder);
  if (query) search.set("q", query);
  const suffix = search.toString();
  return suffix ? `/collections?${suffix}` : "/collections";
}
