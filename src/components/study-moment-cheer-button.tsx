"use client";

import { useState } from "react";

type StudyMomentCheerButtonProps = {
  momentId: string;
  initialCount: number;
};

export function StudyMomentCheerButton({ momentId, initialCount }: StudyMomentCheerButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [cheered, setCheered] = useState(false);
  const [loading, setLoading] = useState(false);

  async function cheer() {
    if (loading || cheered) return;
    setLoading(true);
    try {
      const response = await fetch("/api/learning/study-moments/cheer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ momentId }),
      });
      const payload = (await response.json().catch(() => null)) as { data?: { cheerCount?: number } } | null;
      if (response.ok) {
        setCount(payload?.data?.cheerCount ?? count + 1);
        setCheered(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className={`mt-2 rounded-lg px-3 py-1.5 text-xs font-black ${cheered ? "bg-crystal text-white" : "bg-white text-crystal"}`}
      disabled={loading || cheered}
      onClick={() => void cheer()}
      type="button"
    >
      {cheered ? "Cheered" : "Cheer"} · {count}
    </button>
  );
}
