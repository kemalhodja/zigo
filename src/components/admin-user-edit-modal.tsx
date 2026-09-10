"use client";

import { Check, Copy, ExternalLink, ShieldAlert, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { Database, UserRole } from "@/lib/supabase/database.types";

export type AdminEditableUser = Omit<Database["public"]["Tables"]["users"]["Row"], "role"> & {
  role: string;
  social_safety_strike_count?: number;
  social_interactions_blocked?: boolean;
  teacher_creator_plus?: boolean;
  city?: string | null;
  phone?: string | null;
  website_url?: string | null;
  youtube_url?: string | null;
  instagram_url?: string | null;
};

type AdminUserEditModalProps = {
  user: AdminEditableUser | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated?: (updated: AdminEditableUser) => void;
};

const ROLES: { id: UserRole; label: string; icon: string }[] = [
  { id: "student", label: "Öğrenci", icon: "🎓" },
  { id: "teacher", label: "Öğretmen", icon: "📚" },
  { id: "parent", label: "Veli", icon: "👨‍👩‍👧" },
  { id: "education_institution", label: "Eğitim Kurumu", icon: "🏛️" },
  { id: "education_platform", label: "E-Platform", icon: "💻" },
  { id: "publisher", label: "Yayınevi", icon: "📖" },
];

const ACCOUNT_STATUSES: { id: "active" | "suspended" | "limited" | "closed"; label: string; color: string }[] = [
  { id: "active", label: "Aktif (Normal)", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "suspended", label: "Askıya Alındı", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { id: "limited", label: "Kısıtlandı", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "closed", label: "Kapatıldı", color: "bg-slate-100 text-slate-700 border-slate-300" },
];

const ORG_TYPES = [
  { id: "bireysel", label: "Bireysel" },
  { id: "kurs", label: "Özel Öğretim Kursu" },
  { id: "okul", label: "K12 Özel Okul / Kolej" },
  { id: "egitim_kurumu", label: "Genel Eğitim Kurumu" },
  { id: "egitim_platformu", label: "Dijital Eğitim Platformu" },
  { id: "yayinevi", label: "Yayınevi / Yayın Grubu" },
];

export function AdminUserEditModal({ user, isOpen, onClose, onUserUpdated }: AdminUserEditModalProps) {
  const router = useRouter();

  const [role, setRole] = useState<UserRole>("student");
  const [fullName, setFullName] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [teacherCreatorPlus, setTeacherCreatorPlus] = useState(false);
  const [accountStatus, setAccountStatus] = useState<"active" | "suspended" | "limited" | "closed">("active");
  const [organizationType, setOrganizationType] = useState<string>("bireysel");
  const [strikes, setStrikes] = useState<number>(0);
  const [interactionsBlocked, setInteractionsBlocked] = useState(false);
  const [bio, setBio] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Sync state when user prop changes
  useEffect(() => {
    if (user) {
      setRole((user.role as UserRole) ?? "student");
      setFullName(user.full_name ?? "");
      setIsVerified(Boolean(user.is_verified));
      setIsPremium(Boolean(user.is_premium));
      setTeacherCreatorPlus(Boolean(user.teacher_creator_plus));
      setAccountStatus((user.account_status as "active" | "suspended" | "limited" | "closed") ?? "active");
      setOrganizationType(user.organization_type ?? "bireysel");
      setStrikes(user.social_safety_strike_count ?? 0);
      setInteractionsBlocked(Boolean(user.social_interactions_blocked));
      setBio(user.bio ?? "");
      setWebsiteUrl(user.website_url ?? "");
      setYoutubeUrl(user.youtube_url ?? "");
      setInstagramUrl(user.instagram_url ?? "");
      setError(null);
      setSuccess(false);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  async function handleCopyId() {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // ignore
    }
  }

  function handleResetStrikes() {
    setStrikes(0);
    setInteractionsBlocked(false);
  }

  async function handleSave() {
    if (!user || isSaving) return;
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          role,
          fullName: fullName.trim() || undefined,
          isVerified,
          isPremium,
          teacherCreatorPlus,
          accountStatus,
          organizationType: organizationType || null,
          moderationStrikes: strikes,
          socialInteractionsBlocked: interactionsBlocked,
          bio: bio.trim() || null,
          websiteUrl: websiteUrl.trim() || null,
          youtubeUrl: youtubeUrl.trim() || null,
          instagramUrl: instagramUrl.trim() || null,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "Güncelleme başarısız oldu.");
      }

      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([40, 60, 40]);
      }

      setSuccess(true);
      if (payload.data && onUserUpdated) {
        onUserUpdated(payload.data as AdminEditableUser);
      }

      router.refresh();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Güncelleme sırasında hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col"
        role="dialog"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-crystal to-violet-600 text-lg font-black text-white shadow-sm">
              {(user.full_name || "K")[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-night">{user.full_name}</h3>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.65rem] font-black uppercase text-crystal">
                  {user.role}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                <span>{user.email}</span>
                <span>•</span>
                <button
                  className="inline-flex items-center gap-1 font-mono text-[0.65rem] hover:text-crystal transition"
                  onClick={handleCopyId}
                  title="Kullanıcı ID'sini kopyala"
                  type="button"
                >
                  {user.id.slice(0, 8)}…
                  {copiedId ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/users/${user.id}`}
              className="tap-scale inline-flex items-center gap-1 rounded-xl bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700 hover:bg-violet-100 transition border border-violet-200"
            >
              360° Sayfası ↗
            </Link>
            <button
              className="tap-scale flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              onClick={onClose}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 space-y-6 p-6">
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-700">
              <Check className="size-4 text-emerald-600" />
              Kullanıcı özellikleri başarıyla kaydedildi!
            </div>
          )}

          {/* 1. Rol Yönetimi */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">
              Kullanıcı Rolü (RBAC)
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ROLES.map((r) => {
                const isSelected = role === r.id;
                return (
                  <button
                    className={`tap-scale flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-black transition ${
                      isSelected
                        ? "border-crystal bg-crystal/10 text-crystal ring-2 ring-crystal/30"
                        : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
                    }`}
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    type="button"
                  >
                    <span className="text-base">{r.icon}</span>
                    <span className="truncate">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Abonelik ve Rozet Yetkileri (Toggles) */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">
              Yetki & Abonelik Durumları
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Verified Toggle */}
              <div
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 transition ${
                  isVerified ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50/50"
                }`}
                onClick={() => setIsVerified(!isVerified)}
              >
                <div>
                  <p className="text-xs font-black text-night">Doğrulanmış Rozeti</p>
                  <p className="text-[0.65rem] font-bold text-slate-400">is_verified onaylı hesap</p>
                </div>
                <div
                  className={`size-6 rounded-full flex items-center justify-center text-xs font-black ${
                    isVerified ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {isVerified ? "✓" : "×"}
                </div>
              </div>

              {/* Zigo Plus Premium Toggle */}
              <div
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 transition ${
                  isPremium ? "border-amber-200 bg-amber-50/50" : "border-slate-200 bg-slate-50/50"
                }`}
                onClick={() => setIsPremium(!isPremium)}
              >
                <div>
                  <p className="text-xs font-black text-night">Zigo Plus (Premium)</p>
                  <p className="text-[0.65rem] font-bold text-slate-400">Tam SaaS erişim hakkı</p>
                </div>
                <div
                  className={`size-6 rounded-full flex items-center justify-center text-xs font-black ${
                    isPremium ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {isPremium ? "★" : "×"}
                </div>
              </div>

              {/* Creator Plus Toggle */}
              <div
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 transition ${
                  teacherCreatorPlus ? "border-violet-200 bg-violet-50/50" : "border-slate-200 bg-slate-50/50"
                }`}
                onClick={() => setTeacherCreatorPlus(!teacherCreatorPlus)}
              >
                <div>
                  <p className="text-xs font-black text-night">Creator Plus</p>
                  <p className="text-[0.65rem] font-bold text-slate-400">Gelişmiş içerik/yayıncı araçları</p>
                </div>
                <div
                  className={`size-6 rounded-full flex items-center justify-center text-xs font-black ${
                    teacherCreatorPlus ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {teacherCreatorPlus ? "🚀" : "×"}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Hesap Durumu */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">
              Hesap Durumu (Account Status)
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ACCOUNT_STATUSES.map((st) => {
                const isSelected = accountStatus === st.id;
                return (
                  <button
                    className={`tap-scale rounded-xl border px-3 py-2.5 text-center text-xs font-black transition ${st.color} ${
                      isSelected ? "ring-2 ring-night/40 shadow-sm" : "opacity-60 hover:opacity-100"
                    }`}
                    key={st.id}
                    onClick={() => setAccountStatus(st.id)}
                    type="button"
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Organizasyon Türü */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">
              Organizasyon Türü
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-bold text-night outline-none focus:border-crystal focus:bg-white"
              onChange={(e) => setOrganizationType(e.target.value)}
              value={organizationType}
            >
              {ORG_TYPES.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.label}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Moderasyon İhlal & Güvenlik Cezaları */}
          <div className="space-y-2 rounded-2xl border border-rose-100 bg-rose-50/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700">
                <ShieldAlert className="size-4" />
                <span className="text-xs font-black uppercase tracking-wider">İhlal Cezaları (Strikes)</span>
              </div>
              <button
                className="tap-scale rounded-lg bg-rose-100 px-2.5 py-1 text-[0.65rem] font-black text-rose-700 hover:bg-rose-200 transition"
                onClick={handleResetStrikes}
                type="button"
              >
                Cezaları Sıfırla
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[0.7rem] font-bold text-slate-500">Ceza Puanı (Strike Sayısı)</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-night outline-none focus:border-rose-400"
                    max={10}
                    min={0}
                    onChange={(e) => setStrikes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    type="number"
                    value={strikes}
                  />
                  <span className="text-xs text-slate-400 font-bold">(2+ ceza kısıtlama getirir)</span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 p-3">
                <div>
                  <p className="text-xs font-bold text-night">Sosyal Etkileşim Engeli</p>
                  <p className="text-[0.65rem] text-slate-400">Yorum ve gönderi paylaşımı</p>
                </div>
                <button
                  className={`rounded-lg px-2.5 py-1 text-xs font-black transition ${
                    interactionsBlocked ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                  onClick={() => setInteractionsBlocked(!interactionsBlocked)}
                  type="button"
                >
                  {interactionsBlocked ? "Engelli 🚫" : "Açık ✓"}
                </button>
              </div>
            </div>
          </div>

          {/* 6. Öğrenci Belgesi (Varsa) */}
          {user.student_document_url && (
            <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
              <div>
                <p className="text-xs font-black text-blue-900">Yüklenen Öğrenci Belgesi</p>
                <p className="text-[0.65rem] text-blue-600">Öğrenci indirim onayı için sunulmuş resmi belge</p>
              </div>
              <a
                className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-black text-white shadow-sm hover:bg-blue-700"
                href={user.student_document_url}
                rel="noreferrer"
                target="_blank"
              >
                <span>Belgeyi İncele</span>
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          )}

          {/* 7. Temel Bilgiler */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-500">Ad Soyad</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-bold text-night outline-none focus:border-crystal focus:bg-white"
                onChange={(e) => setFullName(e.target.value)}
                type="text"
                value={fullName}
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500">Biyografi (Hakkında)</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-bold text-night outline-none focus:border-crystal focus:bg-white"
                onChange={(e) => setBio(e.target.value)}
                placeholder="Profil biyografisi..."
                type="text"
                value={bio}
              />
            </div>
          </div>

          {/* 8. Web Sitesi ve Sosyal Medya Bağlantıları */}
          <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Web Sitesi & Sosyal Medya Bağlantıları
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[0.7rem] font-bold text-slate-600">Web Sitesi</label>
                  {websiteUrl && (
                    <a
                      href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[0.65rem] font-black text-crystal hover:underline flex items-center gap-0.5"
                    >
                      Aç <ExternalLink className="size-2.5" />
                    </a>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-night outline-none focus:border-crystal"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[0.7rem] font-bold text-slate-600">YouTube Kanalı</label>
                  {youtubeUrl && (
                    <a
                      href={youtubeUrl.startsWith("http") ? youtubeUrl : `https://${youtubeUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[0.65rem] font-black text-red-500 hover:underline flex items-center gap-0.5"
                    >
                      Aç <ExternalLink className="size-2.5" />
                    </a>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="https://youtube.com/@kanal"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-night outline-none focus:border-crystal"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[0.7rem] font-bold text-slate-600">Instagram</label>
                  {instagramUrl && (
                    <a
                      href={instagramUrl.startsWith("http") ? instagramUrl : `https://${instagramUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[0.65rem] font-black text-pink-600 hover:underline flex items-center gap-0.5"
                    >
                      Aç <ExternalLink className="size-2.5" />
                    </a>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="https://instagram.com/hesap"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-night outline-none focus:border-crystal"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">
          <button
            className="rounded-xl bg-slate-100 px-5 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-200 transition"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            Vazgeç
          </button>
          <button
            className="tap-scale rounded-xl bg-crystal px-6 py-2.5 text-xs font-black text-white shadow-md shadow-crystal/25 hover:bg-crystal/90 transition disabled:opacity-50"
            disabled={isSaving}
            onClick={handleSave}
            type="button"
          >
            {isSaving ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
