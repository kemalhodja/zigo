"use client";

import { useState } from "react";
import { AdminUserActions } from "./admin-user-actions";
import type { Database } from "@/lib/supabase/database.types";

type User = Database["public"]["Tables"]["users"]["Row"];

export function AdminUserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (query.length < 2) return;

    setStatus("loading");
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Arama başarısız");
      
      const { data } = await res.json();
      setResults(data || []);
      setStatus("idle");
    } catch {
      setStatus("error");
      setResults([]);
    }
  }

  return (
    <section className="-mx-4 bg-white mb-4">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-lg font-black text-night">Kullanıcı Ara</h3>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
          İsim veya e-posta ile kullanıcıları bulun ve hesaplarını yönetin.
        </p>
      </div>
      
      <div className="p-4 border-b border-slate-100">
        <form onSubmit={search} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="İsim veya e-posta..."
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold focus:border-crystal focus:outline-none focus:ring-1 focus:ring-crystal"
          />
          <button
            type="submit"
            disabled={status === "loading" || query.length < 2}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
          >
            {status === "loading" ? "Aranıyor..." : "Ara"}
          </button>
        </form>
      </div>

      {status === "error" && (
        <div className="p-4 text-center">
          <p className="text-sm font-bold text-red-600">Arama sırasında bir hata oluştu.</p>
        </div>
      )}

      {results.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {results.map((user) => (
            <div key={user.id} className="grid gap-3 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-night">{user.full_name}</p>
                  <p className="text-xs font-bold text-slate-500">
                    {user.email} • <span className="uppercase text-crystal">{user.role}</span>
                  </p>
                  <p className="mt-1 text-[0.65rem] font-black uppercase tracking-wider text-slate-400">
                    ID: {user.id}
                  </p>
                  {user.account_status !== "active" && (
                    <span className="mt-1 inline-block rounded bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                      {user.account_status.toUpperCase()}
                    </span>
                  )}
                </div>
                <AdminUserActions
                  isVerified={user.is_verified}
                  userId={user.id}
                  userName={user.full_name}
                  accountStatus={user.account_status}
                />
              </div>
            </div>
          ))}
        </div>
      ) : status === "idle" && query.length >= 2 ? (
        <div className="p-6 text-center">
          <p className="text-sm font-bold text-slate-500">Kullanıcı bulunamadı.</p>
        </div>
      ) : null}
    </section>
  );
}
