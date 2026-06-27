import type { UserRole } from "@/lib/supabase/database.types";

/** Default official support line (env override: NEXT_PUBLIC_SUPPORT_WHATSAPP). */
const DEFAULT_SUPPORT_WHATSAPP = "905365647631";

export type WhatsAppSupportContext = "parent" | "teacher" | "billing" | "setup";

export function normalizeWhatsAppPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length >= 12) return digits.slice(0, 12);
  if (digits.startsWith("0") && digits.length === 11) return `90${digits.slice(1)}`;
  if (digits.length === 10) return `90${digits}`;
  return digits;
}

export function getSupportWhatsAppPhone(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim() || DEFAULT_SUPPORT_WHATSAPP;
  const normalized = normalizeWhatsAppPhone(raw);
  if (normalized.length < 11) return null;
  return normalized;
}

export function formatSupportPhoneDisplay(phone: string): string {
  if (phone.startsWith("90") && phone.length === 12) {
    return `+90 ${phone.slice(2, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`;
  }
  return `+${phone}`;
}

export function buildWhatsAppSupportUrl(message: string): string | null {
  const phone = getSupportWhatsAppPhone();
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function isWhatsAppSupportVisibleForRole(role: UserRole | null | undefined): boolean {
  return role === "parent" || role === "teacher";
}

export function isWhatsAppSupportVisible(
  role: UserRole | null | undefined,
  context: WhatsAppSupportContext,
): boolean {
  if (context === "setup") return true;
  return isWhatsAppSupportVisibleForRole(role);
}
