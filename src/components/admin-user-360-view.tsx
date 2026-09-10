"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { User360Data } from "@/lib/domain/admin-user-details";

import { AdminStudentReportModal } from "./admin-student-report-modal";
import { AdminUserEditModal, type AdminEditableUser } from "./admin-user-edit-modal";

type AdminUser360ViewProps = {
  initialData: User360Data;
};

export function AdminUser360View({ initialData }: AdminUser360ViewProps) {
  const [data, setData] = useState<User360Data>(initialData);
  const [activeTab, setActiveTab] = useState<
    "overview" | "billing" | "safety" | "role" | "posts" | "notes"
  >("overview");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Grant plus state
  const [grantDays, setGrantDays] = useState(30);
  const [grantNote, setGrantNote] = useState("");
  const [isGranting, setIsGranting] = useState(false);

  // Message state
  const [msgTitle, setMsgTitle] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // Admin note state
  const [newNoteText, setNewNoteText] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
    setTimeout(() => setToastMessage(null), 4000);
  }

  // Quick action: Reset strikes & unblock
  async function handleResetStrikes() {
    if (!confirm("Bu kullanıcının tüm ceza puanları sıfırlanacak ve sosyal etkileşim engeli kaldırılacak. Onaylıyor musunuz?")) {
      return;
    }

    try {
      const res = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.user.id,
          moderationStrikes: 0,
          socialInteractionsBlocked: false,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "İşlem başarısız");

      setData((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          social_safety_strike_count: 0,
          social_interactions_blocked: false,
          social_interactions_blocked_at: null,
        },
      }));
      showToast("✓ Cezalar başarıyla sıfırlandı ve engel kaldırıldı!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Hata oluştu");
    }
  }

  // Quick action: Reset trial & 50% discount window
  async function handleResetTrial() {
    if (!confirm("Kullanıcının 7 günlük deneme ve %50 indirim süresi bugünden itibaren 7 gün olarak sıfırlanacak. Onaylıyor musunuz?")) {
      return;
    }

    try {
      const res = await fetch("/api/admin/users/reset-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "İşlem başarısız");

      setData((prev) => ({
        ...prev,
        trial: {
          isWithin7Days: true,
          remainingDays: 7,
          discountPercent: 50,
        },
      }));
      showToast("✓ 7 Günlük Deneme & %50 indirim süresi yenilendi!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Hata oluştu");
    }
  }

  // Quick action: Grant Zigo Plus
  async function handleGrantPlus(e: React.FormEvent) {
    e.preventDefault();
    setIsGranting(true);
    try {
      const res = await fetch("/api/admin/users/grant-plus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.user.id,
          durationDays: Number(grantDays),
          note: grantNote,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Zigo Plus tanımlanamadı");

      setData((prev) => ({
        ...prev,
        user: { ...prev.user, is_premium: true },
        subscription: {
          ...prev.subscription,
          is_active: true,
          status: "active",
          current_period_end: json.periodEndsAt,
        },
        billingGrants: [
          {
            id: String(Date.now()),
            kind: "plus",
            duration_days: grantDays,
            note: grantNote || null,
            period_ends_at: json.periodEndsAt,
            created_at: new Date().toISOString(),
          },
          ...prev.billingGrants,
        ],
      }));

      setIsGrantModalOpen(false);
      setGrantNote("");
      showToast(`✓ Kullanıcıya ${grantDays} gün Zigo Plus hediye edildi!`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setIsGranting(false);
    }
  }

  // Send admin message
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!msgTitle.trim() || !msgBody.trim()) return;

    setIsSendingMsg(true);
    try {
      const res = await fetch("/api/admin/users/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.user.id,
          title: msgTitle.trim(),
          body: msgBody.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Mesaj gönderilemedi");

      setData((prev) => ({
        ...prev,
        adminMessages: [
          {
            id: String(Date.now()),
            title: msgTitle.trim(),
            body: msgBody.trim(),
            is_read: false,
            created_at: new Date().toISOString(),
          },
          ...prev.adminMessages,
        ],
      }));

      setIsMessageModalOpen(false);
      setMsgTitle("");
      setMsgBody("");
      showToast("✓ Mesaj ve sistem bildirimi başarıyla iletildi!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setIsSendingMsg(false);
    }
  }

  // Add internal admin note
  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    setIsAddingNote(true);
    try {
      const tags = selectedTag ? [selectedTag] : [];
      const res = await fetch("/api/admin/users/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.user.id,
          note: newNoteText.trim(),
          tags,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Not eklenemedi");

      setData((prev) => ({
        ...prev,
        adminNotes: [
          {
            id: json.note?.id || String(Date.now()),
            admin_id: json.note?.admin_id || "admin",
            note: newNoteText.trim(),
            tags,
            created_at: new Date().toISOString(),
          },
          ...prev.adminNotes,
        ],
      }));

      setNewNoteText("");
      setSelectedTag(null);
      showToast("✓ Dahili admin notu kaydedildi.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setIsAddingNote(false);
    }
  }

  // Toggle post visibility
  async function handleTogglePostVisibility(postId: string, currentHidden: boolean) {
    try {
      const res = await fetch("/api/admin/posts/toggle-visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          isHidden: !currentHidden,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "İşlem başarısız");

      setData((prev) => ({
        ...prev,
        posts: prev.posts.map((p) =>
          p.id === postId ? { ...p, is_hidden: !currentHidden } : p
        ),
      }));

      showToast(!currentHidden ? "Gönderi gizlendi." : "Gönderi tekrar yayına alındı.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Hata oluştu");
    }
  }

  // Update feedback ticket status
  async function handleUpdateFeedbackStatus(feedbackId: string, status: string, adminNote?: string) {
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackId,
          status,
          adminNote: adminNote ?? null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Güncelleme başarısız");

      setData((prev) => ({
        ...prev,
        feedback: prev.feedback.map((f) =>
          f.id === feedbackId ? { ...f, status, admin_note: adminNote ?? f.admin_note } : f
        ),
      }));
      showToast("✓ Talep durumu güncellendi.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Hata oluştu");
    }
  }

  // Export JSON dossier
  function handleExportJson() {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `zigo-user-360-${data.user.id.slice(0, 8)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("✓ Kullanıcı veri dosyası JSON olarak indirildi.");
  }

  const roleColors: Record<string, { bg: string; text: string; label: string }> = {
    student: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "Öğrenci" },
    teacher: { bg: "bg-violet-50 border-violet-200", text: "text-violet-700", label: "Öğretmen" },
    parent: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", label: "Veli" },
    education_institution: { bg: "bg-sky-50 border-sky-200", text: "text-sky-700", label: "Eğitim Kurumu" },
    education_platform: { bg: "bg-purple-50 border-purple-200", text: "text-purple-700", label: "Eğitim Platformu" },
    publisher: { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", label: "Yayınevi" },
  };

  const roleMeta = roleColors[data.user.role] || {
    bg: "bg-slate-50 border-slate-200",
    text: "text-slate-700",
    label: data.user.role,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toastMessage ? (
        <div className="fixed top-5 right-5 z-50 animate-bounce rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-emerald-400 shadow-2xl border border-emerald-500/30">
          {toastMessage}
        </div>
      ) : null}

      {/* Navigation & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin"
          className="tap-scale inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition"
        >
          ← Yönetim Paneline Dön
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-black text-white shadow-sm hover:bg-slate-800 transition"
          >
            🖨️ Karne Yazdır (PDF)
          </button>
          <Link
            href={`/profile/${data.user.id}`}
            target="_blank"
            className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-black text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition"
          >
            👁️ Profili Önizle ↗
          </Link>
          <button
            type="button"
            onClick={handleExportJson}
            className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-black text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition"
          >
            📥 JSON İndir
          </button>
        </div>
      </div>

      {/* Hero Header Identity Card */}
      <div className="overflow-hidden rounded-3xl bg-white border border-slate-200/80 shadow-sm">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-crystal/90 px-6 py-8 text-white sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-white/20 bg-slate-800 shadow-inner flex items-center justify-center text-2xl font-black">
                {data.user.avatar_url ? (
                  <Image
                    src={data.user.avatar_url}
                    alt={data.user.full_name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <span>{data.user.full_name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                    {data.user.full_name}
                  </h1>
                  {data.user.is_verified ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-black text-emerald-300 border border-emerald-500/40">
                      ✓ Doğrulanmış
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-black text-amber-300 border border-amber-500/40">
                      ⏳ Onay Bekliyor
                    </span>
                  )}
                  {data.user.is_premium ? (
                    <span className="inline-flex items-center rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-black text-slate-950 shadow-sm">
                      ★ Zigo Plus
                    </span>
                  ) : null}
                  {data.user.teacher_creator_plus ? (
                    <span className="inline-flex items-center rounded-full bg-violet-400 px-2.5 py-0.5 text-xs font-black text-slate-950 shadow-sm">
                      🚀 Creator+
                    </span>
                  ) : null}
                </div>

                <p className="text-xs font-medium text-slate-300">
                  {data.user.email} • ID: <code className="text-slate-400">{data.user.id}</code>
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span
                    className={`rounded-lg px-2.5 py-0.5 text-xs font-black border ${roleMeta.bg} ${roleMeta.text}`}
                  >
                    {roleMeta.label}
                  </span>

                  {data.user.account_status !== "active" ? (
                    <span className="rounded-lg bg-rose-500/30 px-2.5 py-0.5 text-xs font-black text-rose-300 border border-rose-500/50 uppercase">
                      Durum: {data.user.account_status}
                    </span>
                  ) : (
                    <span className="rounded-lg bg-emerald-500/20 px-2.5 py-0.5 text-xs font-black text-emerald-300 border border-emerald-500/30">
                      Aktif Hesap
                    </span>
                  )}

                  {Boolean(data.user.social_safety_strike_count > 0) ? (
                    <span className="rounded-lg bg-red-600 px-2.5 py-0.5 text-xs font-black text-white shadow-sm">
                      ⚠️ {data.user.social_safety_strike_count} Ceza Puanı
                    </span>
                  ) : null}

                  {data.user.social_interactions_blocked ? (
                    <span className="rounded-lg bg-rose-900/80 px-2.5 py-0.5 text-xs font-black text-rose-200 border border-rose-700">
                      🚫 Etkileşim Engelli
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-crystal px-4 py-2.5 text-xs font-black text-white hover:bg-crystal/90 transition shadow-md"
              >
                🖨️ Gelişim Karnesi
              </button>

              <button
                type="button"
                onClick={() => setIsGrantModalOpen(true)}
                className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-300 transition shadow-md"
              >
                💎 Zigo Plus Hediye Et
              </button>

              <button
                type="button"
                onClick={handleResetStrikes}
                className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2.5 text-xs font-black text-white hover:bg-rose-500 transition shadow-md"
              >
                🛡️ Cezaları Sıfırla
              </button>

              <button
                type="button"
                onClick={() => setIsMessageModalOpen(true)}
                className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2.5 text-xs font-black text-white hover:bg-white/20 transition backdrop-blur border border-white/20"
              >
                ✉️ Bildirim Gönder
              </button>

              <Link
                href={`/profile/${data.user.id}`}
                target="_blank"
                className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2.5 text-xs font-black text-white hover:bg-white/20 transition backdrop-blur border border-white/20"
              >
                👁️ Önizle ↗
              </Link>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-900 hover:bg-slate-100 transition shadow-md"
              >
                ⚙️ Düzenle
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/80 px-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`whitespace-nowrap px-4 py-3.5 text-xs font-black transition border-b-2 ${
              activeTab === "overview"
                ? "border-crystal text-crystal bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            📊 Genel Bakış & Kimlik
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`whitespace-nowrap px-4 py-3.5 text-xs font-black transition border-b-2 ${
              activeTab === "billing"
                ? "border-crystal text-crystal bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            💳 SaaS & Abonelik ({data.subscription.is_active ? "Aktif" : "Pasif"})
          </button>
          <button
            onClick={() => setActiveTab("safety")}
            className={`whitespace-nowrap px-4 py-3.5 text-xs font-black transition border-b-2 ${
              activeTab === "safety"
                ? "border-crystal text-crystal bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            🛡️ Güvenlik & Cezalar ({data.user.social_safety_strike_count})
          </button>
          <button
            onClick={() => setActiveTab("role")}
            className={`whitespace-nowrap px-4 py-3.5 text-xs font-black transition border-b-2 ${
              activeTab === "role"
                ? "border-crystal text-crystal bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            🎓 Role Özel Veriler ({roleMeta.label})
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            className={`whitespace-nowrap px-4 py-3.5 text-xs font-black transition border-b-2 ${
              activeTab === "posts"
                ? "border-crystal text-crystal bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            📱 Gönderiler ({data.posts.length})
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`whitespace-nowrap px-4 py-3.5 text-xs font-black transition border-b-2 ${
              activeTab === "notes"
                ? "border-crystal text-crystal bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            📝 Admin Notları ({data.adminNotes.length})
          </button>
        </div>
      </div>

      {/* TAB 1: GENEL BAKIŞ & KİMLİK */}
      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main profile attributes */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Temel Profil & İletişim Bilgileri
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500">Ad Soyad</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">{data.user.full_name}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500">E-posta</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">{data.user.email}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500">Kayıt Tarihi</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {new Date(data.user.created_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500">Son Giriş / Aktiflik</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {data.user.last_active_date || "Kayıt yok"}
                  </p>
                </div>
              </div>

              {/* Bio */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500">Biyografi (Bio)</p>
                <p className="text-xs font-medium text-slate-800 mt-1 whitespace-pre-wrap">
                  {data.user.bio || "Biyografi girilmemiş."}
                </p>
              </div>

              {/* External Links */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2">
                <p className="text-xs font-bold text-slate-500">Web & Sosyal Medya Bağlantıları</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-400">Web: </span>
                    {data.user.website_url ? (
                      <a
                        href={data.user.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-crystal hover:underline"
                      >
                        {data.user.website_url}
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-400">Instagram: </span>
                    {data.user.instagram_url ? (
                      <a
                        href={data.user.instagram_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-crystal hover:underline"
                      >
                        Profil ↗
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-400">YouTube: </span>
                    {data.user.youtube_url ? (
                      <a
                        href={data.user.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-crystal hover:underline"
                      >
                        Kanal ↗
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* School / Location details */}
            <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Okul, Sınıf & Bölge Bilgileri
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500">Okul Adı</p>
                  <p className="text-xs font-black text-slate-900 mt-1">
                    {data.user.school_name || "—"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500">Sınıf / Şube</p>
                  <p className="text-xs font-black text-slate-900 mt-1">
                    {data.user.classroom || "—"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500">Sınıf Düzeyi</p>
                  <p className="text-xs font-black text-slate-900 mt-1">
                    {data.user.grade_level || "—"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500">İlçe / İl</p>
                  <p className="text-xs font-black text-slate-900 mt-1">
                    {data.user.district || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Side Cards: Gamification & Verification doc */}
          <div className="space-y-6">
            {/* Gamification radar */}
            <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Gamification & İlerleme
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-amber-50 p-4 border border-amber-100">
                  <div>
                    <p className="text-xs font-bold text-amber-800">Günlük Seri (Streak)</p>
                    <p className="text-xl font-black text-amber-900 mt-0.5">
                      🔥 {data.user.streak_days} Gün
                    </p>
                  </div>
                  <span className="text-2xl">⚡</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-crystal/10 p-4 border border-crystal/20">
                  <div>
                    <p className="text-xs font-bold text-crystal">Seviye & XP</p>
                    <p className="text-xl font-black text-slate-900 mt-0.5">
                      Level {data.user.level} • {data.user.total_points} XP
                    </p>
                  </div>
                  <span className="text-2xl">🏆</span>
                </div>
              </div>
            </div>

            {/* Document verification card */}
            <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Öğrenci / Doğrulama Belgesi
              </h2>

              {data.user.student_document_url ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <p className="text-xs font-bold text-slate-600 mb-2">Yüklenen Belge:</p>
                    <a
                      href={data.user.student_document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-slate-800 transition"
                    >
                      📄 Belgeyi Yeni Sekmede İncele ↗
                    </a>
                  </div>

                  <p className="text-xs font-bold text-slate-500">
                    Durum:{" "}
                    <span className="font-black text-slate-900">
                      {data.user.student_document_status || "Beklemede"}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-400 py-4 text-center">
                  Herhangi bir öğrenci/doğrulama belgesi yüklenmemiş.
                </p>
              )}
            </div>

            {/* Related users / School & Classroom mates */}
            <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                İlişkili Profiller ({data.relatedUsers.length})
              </h2>

              {data.relatedUsers.length > 0 ? (
                <div className="space-y-2.5">
                  {data.relatedUsers.map((ru) => (
                    <div
                      key={ru.id}
                      className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 border border-slate-100 text-xs"
                    >
                      <div>
                        <p className="font-black text-slate-900">{ru.full_name}</p>
                        <p className="text-[0.65rem] font-bold text-slate-400">{ru.email} • {ru.reason}</p>
                      </div>
                      <Link
                        href={`/admin/users/${ru.id}`}
                        className="tap-scale rounded-xl bg-violet-50 px-2.5 py-1 text-[0.65rem] font-black text-violet-700 hover:bg-violet-100 transition border border-violet-200"
                      >
                        360° Sayfa ↗
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-400 py-3 text-center">
                  Aynı okul veya sınıftan ilişkili kullanıcı bulunamadı.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* TAB 2: SAAS & ABONELİK */}
      {activeTab === "billing" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Zigo Plus Status */}
            <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Zigo Plus Abonelik Durumu
                </h2>
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-black ${
                    data.subscription.is_active
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {data.subscription.is_active ? "Aktif Üye" : "Abone Değil"}
                </span>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2">
                <p className="text-xs font-bold text-slate-500">Plan: {data.subscription.plan_slug}</p>
                <p className="text-xs font-bold text-slate-500">
                  Bitiş Tarihi:{" "}
                  {data.subscription.current_period_end
                    ? new Date(data.subscription.current_period_end).toLocaleDateString("tr-TR")
                    : "Belirtilmemiş"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsGrantModalOpen(true)}
                className="w-full tap-scale rounded-xl bg-amber-400 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-300 transition shadow-sm"
              >
                + Manuel Zigo Plus Tanımla / Süre Uzat
              </button>
            </div>

            {/* 7-Day Trial & 50% Discount Engine */}
            <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  7 Günlük Deneme & %50 İndirim Penceresi
                </h2>
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-black ${
                    data.trial.isWithin7Days
                      ? "bg-violet-100 text-violet-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {data.trial.isWithin7Days ? "%50 İndirim Açık" : "%0 Standart Fiyat"}
                </span>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1.5 text-xs">
                <p className="font-bold text-slate-600">
                  Kayıt Sonrası Kalan İndirim Süresi:{" "}
                  <span className="font-black text-slate-900">
                    {data.trial.isWithin7Days ? `${data.trial.remainingDays} gün` : "Süre doldu"}
                  </span>
                </p>
                <p className="text-slate-500 font-medium">
                  {data.trial.isWithin7Days
                    ? "Kullanıcı ilk 7 gün içinde olduğu için ZIGO50 kodu ve %50 indirimli fiyat uygulanır."
                    : "7 gün geçtiği için sistem otomatik olarak %0 standart liste fiyatına geçmiştir."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetTrial}
                className="w-full tap-scale rounded-xl bg-slate-900 py-2.5 text-xs font-black text-white hover:bg-slate-800 transition shadow-sm"
              >
                🔄 7 Günlük %50 İndirim Hakkını Sıfırla (Yeniden Tanımla)
              </button>
            </div>
          </div>

          {/* Bank Transfer Receipts */}
          <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Havale / EFT Dekont Geçmişi ({data.bankTransfers.length})
            </h2>

            {data.bankTransfers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Tarih</th>
                      <th className="p-3">Plan</th>
                      <th className="p-3">Tutar</th>
                      <th className="p-3">Durum</th>
                      <th className="p-3">Dekont</th>
                      <th className="p-3">Admin Notu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {data.bankTransfers.map((t) => (
                      <tr key={t.id}>
                        <td className="p-3 text-slate-500">
                          {new Date(t.created_at).toLocaleDateString("tr-TR")}
                        </td>
                        <td className="p-3 font-bold text-slate-900">{t.plan_slug}</td>
                        <td className="p-3 font-bold text-slate-900">
                          {(t.amount_krs / 100).toLocaleString("tr-TR")} TL
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded px-2 py-0.5 text-[0.65rem] font-black ${
                              t.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : t.status === "rejected"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {t.receipt_url ? (
                            <a
                              href={t.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-crystal hover:underline"
                            >
                              Görüntüle ↗
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-3 text-slate-500">{t.admin_note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-400 py-4 text-center">
                Havale/EFT dekont kaydı bulunmamaktadır.
              </p>
            )}
          </div>

          {/* Admin Billing Grants History */}
          <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Admin Hediye & Yetkilendirme Defteri ({data.billingGrants.length})
            </h2>

            {data.billingGrants.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {data.billingGrants.map((g) => (
                  <div key={g.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">
                        +{g.duration_days} Gün {g.kind.toUpperCase()} Hediye Edildi
                      </p>
                      <p className="text-slate-500">{g.note || "Açıklama girilmemiş"}</p>
                    </div>
                    <span className="text-slate-400 font-bold">
                      {new Date(g.created_at).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-400 py-4 text-center">
                Admin hediye kaydı bulunmamaktadır.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {/* TAB 3: GÜVENLİK, CEZALAR & MODERASYON */}
      {activeTab === "safety" ? (
        <div className="space-y-6">
          {/* Strike count & quick reset banner */}
          <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Topluluk Kuralları & İhlal Puanı
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-3xl font-black text-rose-600">
                  {data.user.social_safety_strike_count} / 10
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {data.user.social_interactions_blocked
                    ? "🚫 Sosyal etkileşimleri (mesaj, yorum, paylaşım) engellenmiş durumda."
                    : "✅ Sosyal etkileşimleri açık durumda."}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetStrikes}
              className="tap-scale rounded-xl bg-rose-600 px-5 py-3 text-xs font-black text-white hover:bg-rose-500 transition shadow-md"
            >
              🛡️ Cezaları Sıfırla ve Engeli Kaldır
            </button>
          </div>

          {/* Content Reports Against User */}
          <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Kullanıcı Hakkında Gelen Şikayetler ({data.reports.length})
            </h2>

            {data.reports.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {data.reports.map((r) => (
                  <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-rose-600">{r.reason}</span>
                      <p className="text-slate-600 mt-0.5">{r.details || "Detay yok"}</p>
                    </div>
                    <span className="rounded bg-slate-100 px-2 py-1 font-bold text-slate-600">
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-400 py-4 text-center">
                Bu kullanıcı hakkında bildirilmiş herhangi bir şikayet bulunmamaktadır.
              </p>
            )}
          </div>

          {/* Moderation Violations Log */}
          <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Kayıtlı İhlal Geçmişi ({data.violations.length})
            </h2>

            {data.violations.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {data.violations.map((v) => (
                  <div key={v.id} className="py-3 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{v.violation_type}</p>
                      <p className="text-slate-500">{v.notes || "Not yok"}</p>
                    </div>
                    <span className="rounded bg-red-50 px-2 py-0.5 font-bold text-red-600">
                      {v.severity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-400 py-4 text-center">
                Kayıtlı moderasyon ihlali bulunmamaktadır.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {/* TAB 4: ROLE ÖZEL CANLI VERİLER */}
      {activeTab === "role" ? (
        <div className="space-y-6">
          {/* STUDENT ROLE INSIGHTS */}
          {data.user.role === "student" ? (
            <div className="space-y-6">
              {/* Game limit & curfew radar */}
              <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Oyun Salonu & Süre Yönetimi (Game Gate)
                  </h2>
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-black ${
                      data.roleSpecific.isCurfewActive
                        ? "bg-rose-100 text-rose-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {data.roleSpecific.isCurfewActive ? "Gece Yasağı Aktif (22:00-08:00)" : "Oyun Saatleri Açık"}
                  </span>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">Bugünkü Oyun Süresi</span>
                    <span className="text-slate-900">
                      {data.roleSpecific.gameMinutesToday} dk / {data.roleSpecific.gameLimitMinutes} dk (Azami 2 Saat)
                    </span>
                  </div>

                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full transition-all ${
                        data.roleSpecific.gameMinutesToday >= 120
                          ? "bg-rose-600"
                          : data.roleSpecific.gameMinutesToday >= 90
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (data.roleSpecific.gameMinutesToday / data.roleSpecific.gameLimitMinutes) * 100
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="text-[0.7rem] font-bold text-slate-500">
                    * Zigo Core kuralı: Öğrenciler günde en fazla 120 dakika oynayabilir ve 22:00-08:00 saatleri arasında oyun salonu kilitlenir.
                  </p>
                </div>

                {/* Game High Scores */}
                <div>
                  <h3 className="text-xs font-black text-slate-700 uppercase mb-3">
                    Mini Oyun Rekorları
                  </h3>
                  {data.roleSpecific.gameScores.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {data.roleSpecific.gameScores.map((g) => (
                        <div key={g.game_type} className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                          <p className="text-xs font-bold text-slate-500 uppercase">{g.game_type}</p>
                          <p className="text-lg font-black text-slate-900 mt-1">
                            {g.high_score.toLocaleString("tr-TR")} Puan
                          </p>
                          <p className="text-[0.65rem] font-bold text-slate-400 mt-0.5">
                            Level: {g.level} • Yıldız: {g.stars}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-slate-400 py-2">
                      Henüz mini oyun skoru kaydedilmemiş.
                    </p>
                  )}
                </div>

                {/* Quiz Attempts */}
                <div className="pt-2">
                  <h3 className="text-xs font-black text-slate-700 uppercase mb-3">
                    Çözülen Quizler ({data.roleSpecific.quizAttempts.length})
                  </h3>
                  {data.roleSpecific.quizAttempts.length > 0 ? (
                    <div className="divide-y divide-slate-100 text-xs">
                      {data.roleSpecific.quizAttempts.map((q) => (
                        <div key={q.id} className="py-2.5 flex items-center justify-between">
                          <span className="font-bold text-slate-900">{q.quiz_title}</span>
                          <span className="font-black text-crystal">
                            {q.score} / {q.total_questions} Doğru
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-slate-400 py-2">Henüz quiz çözülmemiş.</p>
                  )}
                </div>

                {/* Parental consent */}
                <div className="pt-2">
                  <h3 className="text-xs font-black text-slate-700 uppercase mb-2">
                    Veli Onayı (Parental Consent)
                  </h3>
                  {data.roleSpecific.parentConsent ? (
                    <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">
                          {data.roleSpecific.parentConsent.parent_email}
                        </p>
                        <p className="text-slate-500">
                          Talep Tarihi:{" "}
                          {new Date(data.roleSpecific.parentConsent.requested_at).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                      <span className="rounded px-2 py-0.5 font-black bg-emerald-100 text-emerald-800">
                        {data.roleSpecific.parentConsent.status}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-slate-400">Veli onayı kaydı yok.</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* TEACHER ROLE INSIGHTS */}
          {data.user.role === "teacher" ? (
            <div className="space-y-6">
              {/* Private lesson requests */}
              <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Özel Ders Talepleri ({data.roleSpecific.lessonRequests.length})
                </h2>

                {data.roleSpecific.lessonRequests.length > 0 ? (
                  <div className="divide-y divide-slate-100 text-xs">
                    {data.roleSpecific.lessonRequests.map((l) => (
                      <div key={l.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">
                            Öğrenci: {l.student_name} • Konu: {l.topic}
                          </p>
                          <p className="text-slate-500">
                            {l.hourly_rate_krs ? `${l.hourly_rate_krs / 100} TL/saat` : "Ücret belirtilmemiş"}
                          </p>
                        </div>
                        <span className="rounded px-2.5 py-1 font-black bg-violet-100 text-violet-800">
                          {l.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-bold text-slate-400 py-4 text-center">
                    Özel ders talebi kaydı bulunmamaktadır.
                  </p>
                )}
              </div>

              {/* Expertise areas */}
              <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-3">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Öğretmen Uzmanlık / Ders Alanları
                </h2>
                {data.roleSpecific.teacherAreas.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {data.roleSpecific.teacherAreas.map((area) => (
                      <span
                        key={area}
                        className="rounded-xl bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700 border border-violet-100"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-bold text-slate-400">Atanmış uzmanlık alanı yok.</p>
                )}
              </div>
            </div>
          ) : null}

          {/* PARENT ROLE INSIGHTS */}
          {data.user.role === "parent" ? (
            <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Bağlı Çocuk Profilleri ({data.roleSpecific.children.length})
              </h2>

              {data.roleSpecific.children.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {data.roleSpecific.children.map((child) => (
                    <div key={child.id} className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                      <p className="text-sm font-black text-slate-900">{child.display_name}</p>
                      <p className="text-xs font-bold text-slate-500 mt-1">
                        Yaş Grubu: {child.age_group || "Belirtilmemiş"} • Toplam Puan: {child.total_points}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-400 py-4 text-center">
                  Bağlı çocuk profili bulunmamaktadır.
                </p>
              )}
            </div>
          ) : null}

          {/* INSTITUTION / PLATFORM / PUBLISHER */}
          {["education_institution", "education_platform", "publisher"].includes(data.user.role) ? (
            <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Kurumsal Yapı & İçerik Üretimi
              </h2>
              <p className="text-xs font-bold text-slate-600">
                Kurum Tipi: <span className="text-slate-900 font-black">{data.user.organization_type || "Standart"}</span>
              </p>
              <p className="text-xs font-medium text-slate-500">
                Kurumsal yayıncılar ve platformlar Zigo Plus abonesi olduklarında sınırsız soru bankası ve eğitim içeriği paylaşabilirler.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* TAB 5: GÖNDERİLER & MEDYA */}
      {activeTab === "posts" ? (
        <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Paylaşılan Gönderiler & Reels ({data.posts.length})
          </h2>

          {data.posts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.posts.map((post) => (
                <div
                  key={post.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between"
                >
                  <div className="p-4 space-y-2">
                    {post.media_url ? (
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900">
                        {post.media_type === "video" ? (
                          <video
                            src={post.media_url}
                            className="h-full w-full object-cover"
                            controls
                          />
                        ) : (
                          <Image
                            src={post.media_url}
                            alt="Post media"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        )}
                      </div>
                    ) : null}

                    <p className="text-xs font-medium text-slate-800 line-clamp-3">
                      {post.content || "Metin yok"}
                    </p>
                  </div>

                  <div className="border-t border-slate-200 bg-white p-3 flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2 text-slate-500">
                      <span>❤️ {post.likes_count}</span>
                      <span>💬 {post.comments_count}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTogglePostVisibility(post.id, post.is_hidden)}
                      className={`rounded-lg px-2.5 py-1 text-[0.65rem] font-black transition ${
                        post.is_hidden
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                      }`}
                    >
                      {post.is_hidden ? "Yayına Al" : "Gönderiyi Gizle"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs font-bold text-slate-400 py-8 text-center">
              Kullanıcının henüz paylaştığı bir gönderi bulunmamaktadır.
            </p>
          )}
        </div>
      ) : null}

      {/* TAB 6: DAHİLİ ADMİN NOTLARI */}
      {activeTab === "notes" ? (
        <div className="space-y-6">
          {/* Add note form */}
          <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Yeni Dahili Admin Notu Ekle
            </h2>
            <p className="text-xs font-bold text-slate-500">
              * Bu notlar yalnızca platform yöneticileri tarafından görülebilir; kullanıcılar asla göremez.
            </p>

            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Örn: 11 Eylül'de veli ile telefonla görüşüldü, dekont teyit edildi..."
                className="w-full rounded-2xl border border-slate-200 p-4 text-xs font-medium text-slate-900 focus:border-crystal focus:outline-none focus:ring-2 focus:ring-crystal/20"
                rows={3}
                required
              />

              {/* Quick tags */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Etiket:</span>
                {["⭐ VIP", "⚠️ Riskli", "👨‍🏫 Örnek Öğretmen", "💳 Dekont İncelendi", "📞 Görüşüldü"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-black transition ${
                      selectedTag === tag
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isAddingNote || !newNoteText.trim()}
                  className="tap-scale rounded-xl bg-crystal px-5 py-2.5 text-xs font-black text-white hover:bg-crystal/90 transition shadow-sm disabled:opacity-50"
                >
                  {isAddingNote ? "Kaydediliyor..." : "Notu Kaydet"}
                </button>
              </div>
            </form>
          </div>

          {/* Notes list */}
          <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Kayıtlı Admin Notları ({data.adminNotes.length})
            </h2>

            {data.adminNotes.length > 0 ? (
              <div className="space-y-3">
                {data.adminNotes.map((note) => (
                  <div key={note.id} className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-400">
                        {new Date(note.created_at).toLocaleString("tr-TR")}
                      </span>
                      {note.tags.map((t) => (
                        <span key={t} className="rounded bg-violet-100 px-2 py-0.5 text-[0.65rem] font-black text-violet-800">
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs font-medium text-slate-900 whitespace-pre-wrap">{note.note}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-400 py-4 text-center">
                Henüz dahili not eklenmemiş.
              </p>
            )}
          </div>

          {/* User Feedback & Support Tickets */}
          <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Destek Talepleri & Geri Bildirimler ({data.feedback.length})
            </h2>

            {data.feedback.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {data.feedback.map((f) => (
                  <div key={f.id} className="py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">{f.subject}</span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-slate-600">
                          {f.category}
                        </span>
                      </div>
                      <span
                        className={`rounded px-2.5 py-0.5 text-[0.65rem] font-black ${
                          f.status === "resolved"
                            ? "bg-emerald-100 text-emerald-800"
                            : f.status === "in_progress"
                            ? "bg-amber-100 text-amber-800"
                            : f.status === "closed"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {f.status}
                      </span>
                    </div>

                    <p className="text-slate-700 font-medium whitespace-pre-wrap">{f.content}</p>
                    {f.admin_note && (
                      <p className="text-violet-700 bg-violet-50 p-2 rounded-xl text-[0.7rem] font-bold">
                        Admin Notu: {f.admin_note}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-slate-400 font-bold text-[0.65rem]">
                        {new Date(f.created_at).toLocaleDateString("tr-TR")}
                      </span>
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateFeedbackStatus(f.id, "in_progress")}
                          className="rounded-lg bg-amber-50 px-2.5 py-1 text-[0.65rem] font-bold text-amber-800 hover:bg-amber-100 transition"
                        >
                          İnceleniyor Yap
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateFeedbackStatus(f.id, "resolved")}
                          className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-bold text-emerald-800 hover:bg-emerald-100 transition"
                        >
                          ✓ Çözüldü
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateFeedbackStatus(f.id, "closed")}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-[0.65rem] font-bold text-slate-600 hover:bg-slate-200 transition"
                        >
                          Kapat
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-400 py-4 text-center">
                Kullanıcı tarafından açılmış bir destek talebi bulunmamaktadır.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {/* Grant Plus Modal */}
      {isGrantModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-black text-slate-900">
              💎 Kullanıcıya Zigo Plus Hediye Et
            </h3>
            <p className="text-xs font-bold text-slate-500">
              {data.user.full_name} kullanıcısına ücretsiz Zigo Plus tanımlayın.
            </p>

            <form onSubmit={handleGrantPlus} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Süre Seçin
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { days: 7, label: "7 Gün" },
                    { days: 30, label: "1 Ay" },
                    { days: 90, label: "3 Ay" },
                    { days: 365, label: "1 Yıl" },
                  ].map((item) => (
                    <button
                      key={item.days}
                      type="button"
                      onClick={() => setGrantDays(item.days)}
                      className={`rounded-xl py-2 text-xs font-black transition ${
                        grantDays === item.days
                          ? "bg-amber-400 text-slate-950 shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Açıklama / Hediye Nedeni
                </label>
                <input
                  type="text"
                  value={grantNote}
                  onChange={(e) => setGrantNote(e.target.value)}
                  placeholder="Örn: Quiz birinciliği ödülü / Veli desteği"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-900 focus:border-crystal focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGrantModalOpen(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isGranting}
                  className="rounded-xl bg-amber-400 px-5 py-2 text-xs font-black text-slate-950 hover:bg-amber-300 transition shadow-sm disabled:opacity-50"
                >
                  {isGranting ? "Tanımlanıyor..." : "Zigo Plus Tanımla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Message Modal */}
      {isMessageModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-black text-slate-900">
              ✉️ Kullanıcıya Özel Bildirim Gönder
            </h3>
            <p className="text-xs font-bold text-slate-500">
              Bu mesaj kullanıcının Zigo Gelen Kutusu&apos;na ve telefonuna anında Push bildirimi olarak iletilir.
            </p>

            <form onSubmit={handleSendMessage} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Başlık
                </label>
                <input
                  type="text"
                  value={msgTitle}
                  onChange={(e) => setMsgTitle(e.target.value)}
                  placeholder="Örn: Öğrenci Belgeniz Onaylandı!"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-900 focus:border-crystal focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mesaj Metni
                </label>
                <textarea
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  placeholder="Kullanıcıya iletmek istediğiniz detaylı mesaj..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 focus:border-crystal focus:outline-none"
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMessageModalOpen(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSendingMsg}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-black text-white hover:bg-slate-800 transition shadow-sm disabled:opacity-50"
                >
                  {isSendingMsg ? "Gönderiliyor..." : "Mesajı İlet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Admin User Edit Modal Integration */}
      <AdminUserEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={data.user as unknown as AdminEditableUser}
        onUserUpdated={(updated) => {
          setData((prev) => ({
            ...prev,
            user: {
              ...prev.user,
              ...updated,
              role: updated.role || prev.user.role,
              is_premium: Boolean(updated.is_premium),
            },
          }));
          showToast("✓ Kullanıcı özellikleri güncellendi!");
        }}
      />

      {/* Official Student Performance Report Dossier Modal */}
      <AdminStudentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        data={data}
      />
    </div>
  );
}
