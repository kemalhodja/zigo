"use client";

import { useState } from "react";

import { AdminBillingGrantActions } from "./admin-billing-grant-actions";
import { AdminUserActions } from "./admin-user-actions";
import { useMessages } from "@/lib/i18n/locale-context";
import type { Database } from "@/lib/supabase/database.types";

type User = Database["public"]["Tables"]["users"]["Row"];

export function AdminUserSearch() {
  const {
    ops: { admin: a },
  } = useMessages();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [results, setResults] = useState<User[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "empty">("idle");

  const filteredResults = results.filter((u) => {
    if (roleFilter === "all") return true;
    if (roleFilter === "student") return u.role === "student";
    if (roleFilter === "parent") return u.role === "parent";
    if (roleFilter === "teacher") return u.role === "teacher" && (!u.organization_type || u.organization_type === null);
    if (roleFilter === "institution") return u.organization_type === "egitim_kurumu" || u.organization_type === "kurs" || u.organization_type === "okul";
    if (roleFilter === "platform") return u.organization_type === "egitim_platformu";
    if (roleFilter === "publisher") return u.organization_type === "yayinevi";
    return true;
  });

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (query.length < 2) return;

    setStatus("loading");
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("search failed");

      const { data } = (await res.json()) as { data?: User[] };
      const next = data ?? [];
      setResults(next);
      setStatus(next.length === 0 ? "empty" : "idle");
    } catch {
      setStatus("error");
      setResults([]);
    }
  }

  return (
    <section className="-mx-4 mb-4 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-lg font-black text-night">{a.userSearchTitle}</h3>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{a.userSearchDesc}</p>
      </div>

      <div className="border-b border-slate-100 p-4 space-y-3">
        <form className="flex gap-2" onSubmit={search}>
          <input
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold focus:border-crystal focus:outline-none focus:ring-1 focus:ring-crystal"
            onChange={(e) => setQuery(e.target.value)}
            placeholder={a.userSearchPlaceholder}
            value={query}
          />
          <button
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
            disabled={status === "loading" || query.length < 2}
            type="submit"
          >
            {status === "loading" ? a.userSearchSearching : a.userSearchSubmit}
          </button>
        </form>

        {results.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { id: "all", label: "Tüm Roller" },
              { id: "student", label: "🎓 Öğrenci" },
              { id: "teacher", label: "📚 Öğretmen" },
              { id: "parent", label: "👨‍👩‍👧 Veli" },
              { id: "institution", label: "🏛️ Kurum" },
              { id: "platform", label: "💻 Platform" },
              { id: "publisher", label: "📖 Yayınevi" },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setRoleFilter(btn.id)}
                className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                  roleFilter === btn.id
                    ? "bg-crystal text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {status === "error" ? (
        <div className="p-4 text-center">
          <p className="text-sm font-bold text-red-600">{a.userSearchError}</p>
        </div>
      ) : null}

      {filteredResults.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {filteredResults.map((user) => (
            <div className="grid gap-3 px-4 py-4" key={user.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-night">{user.full_name}</p>
                  <p className="text-xs font-bold text-slate-500">
                    {user.email} • <span className="uppercase text-crystal">{user.role}</span>
                  </p>
                  <p className="mt-1 text-[0.65rem] font-black uppercase tracking-wider text-slate-400">
                    ID: {user.id}
                  </p>
                  {user.account_status !== "active" ? (
                    <span className="mt-1 inline-block rounded bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                      {user.account_status.toUpperCase()}
                    </span>
                  ) : null}
                </div>
                <AdminUserActions
                  accountStatus={user.account_status}
                  isVerified={user.is_verified}
                  userId={user.id}
                  userName={user.full_name}
                />
              </div>
              <AdminBillingGrantActions role={user.role} userId={user.id} userName={user.full_name} />
            </div>
          ))}
        </div>
      ) : status === "empty" ? (
        <div className="p-6 text-center">
          <p className="text-sm font-bold text-slate-500">{a.userSearchEmpty}</p>
        </div>
      ) : null}
    </section>
  );
}
