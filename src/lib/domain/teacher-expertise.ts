export type ExpertiseTrackSlug =
  | "temel_seviye"
  | "lgs_hazirlik"
  | "yks_hazirlik"
  | "olimpiyat_matematik"
  | "uslu_sayilar"
  | "geometri"
  | "problem_cozme"
  | "deneme_sinavi"
  | "oyunlastirma";

export type ExpertiseTrack = {
  slug: ExpertiseTrackSlug;
  label: string;
  pillClass: string;
  keywords: string[];
};

export const EXPERTISE_TRACKS: readonly ExpertiseTrack[] = [
  {
    slug: "temel_seviye",
    label: "Temel Seviye",
    pillClass: "bg-slate-100 text-slate-800 ring-slate-200",
    keywords: ["temel", "başlangıç", "ilk adım", "temel seviye"],
  },
  {
    slug: "lgs_hazirlik",
    label: "LGS Hazırlık",
    pillClass: "bg-cyan-100 text-cyan-900 ring-cyan-200",
    keywords: ["lgs", "8. sınıf", "liseye geçiş"],
  },
  {
    slug: "yks_hazirlik",
    label: "YKS Hazırlık",
    pillClass: "bg-indigo-100 text-indigo-900 ring-indigo-200",
    keywords: ["yks", "tyt", "ayt", "üniversite sınav"],
  },
  {
    slug: "olimpiyat_matematik",
    label: "Olimpiyat Matematik",
    pillClass: "bg-amber-100 text-amber-900 ring-amber-200",
    keywords: ["olimpiyat", "olimpik", "yarışma"],
  },
  {
    slug: "uslu_sayilar",
    label: "Üslü Sayılar",
    pillClass: "bg-violet-100 text-violet-900 ring-violet-200",
    keywords: ["üslü sayı", "üs", "kuvvet", "üslü"],
  },
  {
    slug: "geometri",
    label: "Geometri",
    pillClass: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    keywords: ["geometri", "açı", "üçgen", "çember"],
  },
  {
    slug: "problem_cozme",
    label: "Problem Çözme",
    pillClass: "bg-rose-100 text-rose-900 ring-rose-200",
    keywords: ["problem", "mantık", "akıl yürütme"],
  },
  {
    slug: "deneme_sinavi",
    label: "Deneme Sınavı",
    pillClass: "bg-orange-100 text-orange-900 ring-orange-200",
    keywords: ["deneme", "mock", "sınav provası"],
  },
  {
    slug: "oyunlastirma",
    label: "Oyunlaştırarak Öğretim",
    pillClass: "bg-fuchsia-100 text-fuchsia-900 ring-fuchsia-200",
    keywords: ["oyun", "oyunlaştır", "eğlenceli", "interaktif"],
  },
] as const;

const TRACK_BY_SLUG = new Map(EXPERTISE_TRACKS.map((track) => [track.slug, track]));

export function getExpertiseTrack(slug: string) {
  return TRACK_BY_SLUG.get(slug as ExpertiseTrackSlug) ?? null;
}

export function matchExpertiseTracksFromReviewComment(comment: string | null | undefined): ExpertiseTrackSlug[] {
  if (!comment?.trim()) return [];
  const normalized = comment.toLocaleLowerCase("tr-TR");
  const matched: ExpertiseTrackSlug[] = [];

  for (const track of EXPERTISE_TRACKS) {
    if (track.keywords.some((keyword) => normalized.includes(keyword.toLocaleLowerCase("tr-TR")))) {
      matched.push(track.slug);
    }
  }

  return matched;
}

export function expertiseTrackLabel(slug: string) {
  return getExpertiseTrack(slug)?.label ?? slug.replaceAll("_", " ");
}

export function expertiseTrackPillClass(slug: string) {
  return getExpertiseTrack(slug)?.pillClass ?? "bg-slate-100 text-slate-800 ring-slate-200";
}
