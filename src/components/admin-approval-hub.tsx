"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AdminAdApprovalQueue } from "@/components/admin-ad-approval-queue";
import { AdminBankTransferActions } from "@/components/admin-bank-transfer-actions";
import { AdminRoleRequests } from "@/components/admin-role-requests";
import { AdminStudentDocumentActions } from "@/components/admin-student-document-actions";
import { AdminUserActions } from "@/components/admin-user-actions";
import type { AdminEditableUser } from "@/components/admin-user-edit-modal";
import type { AccountStatus } from "@/lib/supabase/database.types";

type ApprovalHubProps = {
  pendingUsers: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    is_verified: boolean;
    created_at: string;
    school_name?: string | null;
    grade_level?: string | null;
    organization_type?: string | null;
    avatar_url?: string | null;
    account_status?: AccountStatus;
  }[];
  studentDocuments: {
    id: string;
    full_name: string;
    grade_level: string | null;
    student_document_url: string | null;
  }[];
  bankTransfers: {
    id: string;
    plan_id: string;
    amount_try: number;
    reference_code: string;
    status: string;
    receipt_storage_path: string | null;
    created_at: string;
    user_id?: string;
    user?: unknown;
  }[];
  onEditUser?: (user: AdminEditableUser) => void;
};

type HubTab = "verification" | "roles" | "documents" | "transfers" | "ads";

export function AdminApprovalHub({
  pendingUsers,
  studentDocuments,
  bankTransfers,
  onEditUser,
}: ApprovalHubProps) {
  const [activeTab, setActiveTab] = useState<HubTab>("verification");

  const pendingTransfers = bankTransfers.filter((t) => t.status === "pending");

  const tabs: { id: HubTab; label: string; count: number; icon: string }[] = [
    { id: "verification", label: "Hesap Doğrulama", count: pendingUsers.length, icon: "🎓" },
    { id: "roles", label: "Rol Talepleri", count: 0, icon: "🔄" },
    { id: "documents", label: "Öğrenci Belgeleri", count: studentDocuments.length, icon: "📄" },
    { id: "transfers", label: "Havale Dekontları", count: pendingTransfers.length, icon: "💳" },
    { id: "ads", label: "Sponsorlu Reklamlar", count: 0, icon: "📢" },
  ];

  return (
    <section className="-mx-4 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Hub Top Bar */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-crystal/20 text-crystal text-sm">
                <ShieldCheck className="size-4" />
              </span>
              <h2 className="text-base font-black tracking-tight">Onay & Takip Merkezi</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400 font-medium">
              Yönetici onayı bekleyen öğretmenler, öğrenci belgeleri, rol başvuruları ve ödeme dekontları.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-[0.7rem] font-black text-slate-300">
              Toplam Bekleyen: {pendingUsers.length + studentDocuments.length + pendingTransfers.length}
            </span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-white/10">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
                className={`tap-scale flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                  isActive
                    ? "bg-crystal text-white shadow-md shadow-crystal/25"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count > 0 ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.65rem] font-black ${
                      isActive ? "bg-white text-crystal" : "bg-amber-400 text-slate-900 animate-pulse"
                    }`}
                  >
                    {tab.count}
                  </span>
                ) : (
                  <span className="text-[0.65rem] opacity-50">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        {/* Tab 1: Hesap Doğrulama (Pending Users) */}
        {activeTab === "verification" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-night">Doğrulama Bekleyen Hesaplar</h3>
                <p className="text-xs text-slate-500">
                  Diploma ve kurumsal bilgilerini sunan veya onay bekleyen kullanıcılar.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">{pendingUsers.length} kişi</span>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                <CheckCircle2 className="mx-auto size-8 text-emerald-500" />
                <p className="mt-2 text-xs font-black text-night">Bekleyen doğrulama talebi yok</p>
                <p className="mt-0.5 text-[0.7rem] text-slate-400">Tüm öğretmen ve kullanıcı profilleri güncel ve onaylı.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
                {pendingUsers.map((u) => (
                  <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-night">{u.full_name}</span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.65rem] font-black uppercase text-crystal">
                          {u.role}
                        </span>
                        {u.organization_type && (
                          <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[0.65rem] font-bold text-violet-700">
                            {u.organization_type}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-bold">{u.email}</p>
                      <p className="text-[0.65rem] text-slate-400">Kayıt: {new Date(u.created_at).toLocaleDateString("tr-TR")}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="tap-scale rounded-xl bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700 hover:bg-violet-100 transition border border-violet-200"
                      >
                        360° Detay ↗
                      </Link>
                      {onEditUser && (
                        <button
                          type="button"
                          onClick={() => onEditUser(u as AdminEditableUser)}
                          className="tap-scale rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-50 transition"
                        >
                          Özellikleri Yönet
                        </button>
                      )}
                      <AdminUserActions
                        accountStatus={u.account_status ?? "active"}
                        isVerified={u.is_verified}
                        userId={u.id}
                        userName={u.full_name}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Rol Değişikliği İstekleri */}
        {activeTab === "roles" && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-night">Rol Değişikliği İstekleri</h3>
              <p className="text-xs text-slate-500">
                Öğrenci veya Veli rolünden Öğretmen/Kurum rolüne geçmek isteyen kullanıcıların başvuruları.
              </p>
            </div>
            <AdminRoleRequests />
          </div>
        )}

        {/* Tab 3: Öğrenci Belgeleri */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-night">Öğrenci Belgesi İnceleme Kuyruğu</h3>
                <p className="text-xs text-slate-500">
                  MEB öğrenci belgesi yükleyen öğrencilerin belge onayları.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">{studentDocuments.length} belge</span>
            </div>

            {studentDocuments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                <CheckCircle2 className="mx-auto size-8 text-emerald-500" />
                <p className="mt-2 text-xs font-black text-night">Bekleyen öğrenci belgesi yok</p>
                <p className="mt-0.5 text-[0.7rem] text-slate-400">Yüklenen tüm belgeler sonuçlandırıldı.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {studentDocuments.map((doc) => (
                  <div key={doc.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <AdminStudentDocumentActions
                      documentUrl={doc.student_document_url}
                      fullName={doc.full_name}
                      gradeLevel={doc.grade_level}
                      studentId={doc.id}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Havale Dekontları */}
        {activeTab === "transfers" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-night">Havale / EFT Ödeme Dekontları</h3>
                <p className="text-xs text-slate-500">
                  Banka transferi ile Zigo Plus paketi satın alanların yüklediği dekontlar.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">{pendingTransfers.length} dekont</span>
            </div>

            {pendingTransfers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                <CheckCircle2 className="mx-auto size-8 text-emerald-500" />
                <p className="mt-2 text-xs font-black text-night">Bekleyen havale dekontu yok</p>
                <p className="mt-0.5 text-[0.7rem] text-slate-400">Tüm banka transfer talepleri onaylandı veya sonuçlandırıldı.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTransfers.map((req) => (
                  <div key={req.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <AdminBankTransferActions
                      request={req as unknown as Parameters<typeof AdminBankTransferActions>[0]["request"]}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Sponsorlu Reklamlar */}
        {activeTab === "ads" && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-night">Sponsorlu İçerik & Reklam Onayları</h3>
              <p className="text-xs text-slate-500">
                Eğitim kurumları ve öğretmenlerin platformda yayınlanmak üzere ilettiği reklamlar.
              </p>
            </div>
            <AdminAdApprovalQueue />
          </div>
        )}
      </div>
    </section>
  );
}
