"use client";

import { useState } from "react";
import type { DisplayPost } from "@/app/_components/home/data";
import { FeedCard } from "./feed-card";
import { FeedModeToggle } from "./feed-mode-toggle";
import { SparklesIcon } from "lucide-react";

/**
 * Props for the FeedContainer component.
 */
interface FeedContainerProps {
  /** Array of posts to display */
  posts: DisplayPost[];
  /** Viewer's role for customized rendering logic */
  viewerRole: "teacher" | "student" | "parent" | "institution" | "publisher" | "guest" | null;
}

/**
 * FeedContainer manages the display of the post feed and mode toggling.
 */
export function FeedContainer({ posts, viewerRole }: FeedContainerProps) {
  const [mode, setMode] = useState<"summary" | "infinite">("summary");

  const displayedPosts = mode === "summary" ? posts.slice(0, 10) : posts; 
  const safeRole = (viewerRole === "teacher" || viewerRole === "student" || viewerRole === "institution" || viewerRole === "publisher" || viewerRole === "parent" || viewerRole === "guest") ? viewerRole : "guest";

  return (
    <div className="flex flex-col gap-2">
      <FeedModeToggle mode={mode} onChange={setMode} />
      
      <div className="flex flex-col gap-4">
        {displayedPosts.map((post, idx) => (
          <FeedCard
            key={post.postId || idx}
            author={{
              name: post.authorName,
              handle: post.handle,
              avatarUrl: post.avatarUrl,
            }}
            role={post.verified ? "teacher" : "student"} // Fallback heuristic if explicit post role is missing
            verified={post.verified}
            xpEarned={post.verified ? undefined : 10}
            body={post.caption || "Örnek içerik"}
            engagement={{
              understandCount: post.likes,
              questionCount: post.comments,
            }}
          />
        ))}

        {posts.length === 0 && (
          <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center transition-colors hover:bg-slate-50">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 shadow-inner">
              <SparklesIcon className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-black text-slate-800">Henüz Gönderi Yok</h3>
            <p className="mt-2 max-w-sm text-sm font-medium leading-relaxed text-slate-500">
              Ağınızdaki öğretmenler ve öğrenciler paylaşım yaptıkça akışınız burada canlanacak. İlk adımı siz atın!
            </p>
          </div>
        )}

        {mode === "summary" && posts.length > 0 && (
          <div className="py-6 text-center">
            <button className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-slate-100 px-6 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400/50 active:scale-95">
              <span className="relative z-10 flex items-center gap-2">
                Dünü Gör
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
