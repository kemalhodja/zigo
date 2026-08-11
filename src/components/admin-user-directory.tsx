"use client";

import { useMemo, useState } from "react";

import { getOrganizationOption } from "@/lib/domain/education-organization";
import { parseOrganizationType } from "@/lib/domain/profiles";
import { useMessages } from "@/lib/i18n/locale-context";
import type { Database } from "@/lib/supabase/database.types";

import { AdminBillingGrantActions } from "./admin-billing-grant-actions";
import { AdminTeacherAreaForm } from "./admin-teacher-area-form";
import { AdminUserActions } from "./admin-user-actions";

type User = Database["public"]["Tables"]["users"]["Row"];
type Area = { id: number; area_name: string; age_group: string | null };

type AdminUserDirectoryProps = {
  users: User[];
  areas: Area[];
  studentDocumentUserIds?: string[];
  pendingBankTransferUserIds?: string[];
};

export function AdminUserDirectory({
  users,
  areas,
  studentDocumentUserIds = [],
  pendingBankTransferUserIds = [],
}: AdminUserDirectoryProps) {
  const {
    ops: { admin: a },
  } = useMessages();

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [displayLimit, setDisplayLimit] = useState<number>(20);

  // Match role to filter
  function matchesRole(user: User, filter: string) {
    if (filter === "all") return true;
    const role = (user.role as string) ?? "";
    const orgType = (user.organization_type as string) ?? "";

    if (filter === "teacher") {
      return (
        role === "teacher" &&
        (!orgType || orgType === "bireysel")
      );
    }
    if (filter === "student") return role === "student";
    if (filter === "parent") return role === "parent";
    if (filter === "education_platform") {
      return (
        role === "education_platform" ||
        orgType === "egitim_platformu"
      );
    }
    if (filter === "education_institution") {
      return (
        role === "education_institution" ||
        orgType === "egitim_kurumu" ||
        orgType === "kurs" ||
        orgType === "okul"
      );
    }
    if (filter === "publisher") {
      return (
        role === "publisher" ||
        orgType === "yayinevi"
      );
    }
    return role === filter;
  }

  // Match status category to filter
  function matchesStatus(user: User, filter: string) {
    if (filter === "all") return true;
    if (filter === "pending") return !user.is_verified;
    if (filter === "active") return user.is_verified && user.account_status === "active";
    if (filter === "has_document") {
      return Boolean(user.student_document_url) || studentDocumentUserIds.includes(user.id);
    }
    if (filter === "billing_request") {
      return pendingBankTransferUserIds.includes(user.id);
    }
    if (filter === "restricted") {
      return user.account_status !== "active";
    }
    return true;
  }

  // Search filter
  function matchesSearch(user: User, query: string) {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (user.full_name ?? "").toLowerCase().includes(q) ||
      (user.email ?? "").toLowerCase().includes(q) ||
      (user.id ?? "").toLowerCase().includes(q) ||
      (user.organization_type ?? "").toLowerCase().includes(q)
    );
  }

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        matchesRole(user, roleFilter) &&
        matchesStatus(user, statusFilter) &&
        matchesSearch(user, searchQuery)
    );
  }, [users, roleFilter, statusFilter, searchQuery, studentDocumentUserIds, pendingBankTransferUserIds]);

  // Counts for badge numbers
  const counts = useMemo(() => {
    const roleCounts = {
      all: users.length,
      teacher: users.filter((u) => matchesRole(u, "teacher")).length,
      student: users.filter((u) => matchesRole(u, "student")).length,
      parent: users.filter((u) => matchesRole(u, "parent")).length,
      education_platform: users.filter((u) => matchesRole(u, "education_platform")).length,
      education_institution: users.filter((u) => matchesRole(u, "education_institution")).length,
      publisher: users.filter((u) => matchesRole(u, "publisher")).length,
    };

    const statusCounts = {
      all: users.length,
      pending: users.filter((u) => !u.is_verified).length,
      active: users.filter((u) => u.is_verified && u.account_status === "active").length,
      has_document: users.filter(
        (u) => Boolean(u.student_document_url) || studentDocumentUserIds.includes(u.id)
      ).length,
      billing_request: users.filter((u) => pendingBankTransferUserIds.includes(u.id)).length,
      restricted: users.filter((u) => u.account_status !== "active").length,
    };

    return { role: roleCounts, status: statusCounts };
  }, [users, studentDocumentUserIds, pendingBankTransferUserIds]);

  const displayedUsers = filteredUsers.slice(0, displayLimit);

  return (
    <section className="-mx-4 bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-100 px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-night">Kullanıcı Yönetimi & Filtreleme</h3>
            <p className="mt-0.5 text-xs font-bold leading-5 text-slate-500">
              Rol, onay durumu, belge ve ödeme durumuna göre kullanıcı listesini süzün.
            </p>
          </div>
          <span className="self-start sm:self-auto rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-crystal">
            Toplam: {filteredUsers.length} kullanıcı
          </span>
        </div>

        {/* Search Input */}
        <div className="mt-4">
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-bold text-night placeholder-slate-400 focus:border-crystal focus:bg-white focus:outline-none focus:ring-1 focus:ring-crystal"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="İsim, e-posta veya organizasyon türü ara..."
            type="search"
            value={searchQuery}
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="mt-4 space-y-2">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-400">
            Rol Seçimi
          </p>
          <div className="no-scrollbar flex flex-wrap gap-1.5 overflow-x-auto">
            {[
              { id: "all", label: "Tüm Roller", count: counts.role.all },
              { id: "teacher", label: "📚 Öğretmen", count: counts.role.teacher },
              { id: "student", label: "🎓 Öğrenci", count: counts.role.student },
              { id: "parent", label: "👨‍👩‍👧 Veli", count: counts.role.parent },
              { id: "education_platform", label: "💻 E-Platform", count: counts.role.education_platform },
              { id: "education_institution", label: "🏛️ E-Kurum", count: counts.role.education_institution },
              { id: "publisher", label: "📖 Yayınevi", count: counts.role.publisher },
            ].map((tab) => {
              const active = roleFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setRoleFilter(tab.id)}
                  type="button"
                  className={`tap-scale flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition ${
                    active
                      ? "bg-crystal text-white shadow-sm shadow-crystal/20"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[0.65rem] font-bold ${
                      active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status / Category Filter Chips */}
        <div className="mt-3 space-y-2">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-400">
            Kategori & Durum Filtresi
          </p>
          <div className="no-scrollbar flex flex-wrap gap-1.5 overflow-x-auto">
            {[
              { id: "all", label: "Hepsi", count: counts.status.all },
              { id: "pending", label: "⏳ Onay Bekleyenler", count: counts.status.pending },
              { id: "active", label: "🟢 Aktif Olanlar", count: counts.status.active },
              { id: "has_document", label: "📄 Belge Gönderenler", count: counts.status.has_document },
              { id: "billing_request", label: "💳 Abonelik / Havale", count: counts.status.billing_request },
              { id: "restricted", label: "🔴 Askıda / Sınırlandırılmış", count: counts.status.restricted },
            ].map((chip) => {
              const active = statusFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setStatusFilter(chip.id)}
                  type="button"
                  className={`tap-scale flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold transition ${
                    active
                      ? "border-crystal bg-crystal/10 text-crystal font-black"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span>{chip.label}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.2 text-[0.65rem] ${
                      active ? "bg-crystal text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {chip.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* User List Rows */}
      {displayedUsers.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 text-xl font-bold">
            🔍
          </span>
          <p className="mt-3 text-sm font-black text-night">Kullanıcı bulunamadı</p>
          <p className="mx-auto mt-1 max-w-xs text-xs font-bold text-slate-500">
            Seçilen filtre kriterlerine veya arama sorgusuna uyan kullanıcı yok.
          </p>
          <button
            onClick={() => {
              setRoleFilter("all");
              setStatusFilter("all");
              setSearchQuery("");
            }}
            type="button"
            className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 transition"
          >
            Filtreleri Temizle
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {displayedUsers.map((user) => {
            const orgLabel = getOrganizationOption(parseOrganizationType(user.organization_type))?.label;
            const hasDoc = Boolean(user.student_document_url) || studentDocumentUserIds.includes(user.id);
            const hasBankRequest = pendingBankTransferUserIds.includes(user.id);

            return (
              <div className="grid gap-3 p-4 hover:bg-slate-50/50 transition" key={user.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-night text-sm">{user.full_name}</p>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.65rem] font-black uppercase text-crystal">
                        {user.role}
                      </span>
                      {orgLabel ? (
                        <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[0.65rem] font-bold text-violet-700">
                          {orgLabel}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs font-bold text-slate-500">{user.email}</p>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span
                        className={`text-xs font-black ${
                          user.is_verified ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {user.is_verified ? `✓ ${a.verified}` : `⏳ ${a.pendingVerification}`}
                      </span>

                      {user.account_status !== "active" ? (
                        <span className="rounded bg-red-50 px-2 py-0.5 text-[0.65rem] font-black text-red-600 uppercase">
                          {user.account_status}
                        </span>
                      ) : null}

                      {hasDoc ? (
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-[0.65rem] font-black text-blue-700">
                          📄 Belge Gönderildi
                        </span>
                      ) : null}

                      {hasBankRequest ? (
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-[0.65rem] font-black text-amber-700">
                          💳 Havale/Abonelik İsteği
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <AdminUserActions
                    accountStatus={user.account_status}
                    isVerified={user.is_verified}
                    userId={user.id}
                    userName={user.full_name}
                  />
                </div>

                <AdminBillingGrantActions role={user.role} userId={user.id} userName={user.full_name} />
                {user.role === "teacher" ? <AdminTeacherAreaForm areas={areas} teacherId={user.id} /> : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Load More */}
      {filteredUsers.length > displayLimit ? (
        <div className="border-t border-slate-100 bg-slate-50 p-4 text-center">
          <p className="text-xs font-bold text-slate-500 mb-2">
            {displayLimit} / {filteredUsers.length} kullanıcı gösteriliyor
          </p>
          <button
            onClick={() => setDisplayLimit((prev) => prev + 30)}
            type="button"
            className="rounded-xl bg-crystal px-5 py-2.5 text-xs font-black text-white shadow-sm shadow-crystal/20 transition hover:bg-crystal/90"
          >
            Daha Fazla Göster (+30)
          </button>
        </div>
      ) : null}
    </section>
  );
}
