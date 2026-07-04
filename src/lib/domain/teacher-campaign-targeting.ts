import { z } from "zod";

export const TEACHER_CAMPAIGN_PLACEMENTS = ["explore", "profile_rail", "feed_highlight"] as const;
export type TeacherCampaignPlacement = (typeof TEACHER_CAMPAIGN_PLACEMENTS)[number];

export const TEACHER_CAMPAIGN_TARGET_ROLES = ["student", "parent"] as const;
export type TeacherCampaignTargetRole = (typeof TEACHER_CAMPAIGN_TARGET_ROLES)[number];

export const TEACHER_CAMPAIGN_GRADE_BANDS = [
  "okul_oncesi",
  "ilkokul",
  "ortaokul",
  "lise",
  "lgs",
  "yks",
  "veli",
] as const;
export type TeacherCampaignGradeBand = (typeof TEACHER_CAMPAIGN_GRADE_BANDS)[number];

export const TEACHER_CAMPAIGN_ALL_CITIES = "all" as const;

export const TEACHER_CAMPAIGN_TURKEY_CITIES = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Adana",
  "Konya",
  "Gaziantep",
  "Kocaeli",
  "Mersin",
  "Kayseri",
  "Eskişehir",
  "Samsun",
  "Trabzon",
  "Diyarbakır",
] as const;

export const sponsoredTargetingSchema = z.object({
  placements: z.array(z.enum(TEACHER_CAMPAIGN_PLACEMENTS)).min(1).default(["explore", "profile_rail", "feed_highlight"]),
  cities: z.array(z.union([z.literal(TEACHER_CAMPAIGN_ALL_CITIES), z.string().trim().min(2).max(80)])).min(1).default([TEACHER_CAMPAIGN_ALL_CITIES]),
  roles: z.array(z.enum(TEACHER_CAMPAIGN_TARGET_ROLES)).min(1).default(["student", "parent"]),
  gradeBands: z.array(z.enum(TEACHER_CAMPAIGN_GRADE_BANDS)).min(1).default([...TEACHER_CAMPAIGN_GRADE_BANDS]),
  areaIds: z.array(z.number().int().positive()).default([]),
});

export type SponsoredCampaignTargeting = z.infer<typeof sponsoredTargetingSchema>;

export const DEFAULT_SPONSORED_TARGETING: SponsoredCampaignTargeting = {
  placements: ["explore", "profile_rail", "feed_highlight"],
  cities: [TEACHER_CAMPAIGN_ALL_CITIES],
  roles: ["student", "parent"],
  gradeBands: [...TEACHER_CAMPAIGN_GRADE_BANDS],
  areaIds: [],
};

export function normalizeSponsoredTargeting(input: unknown): SponsoredCampaignTargeting {
  const parsed = sponsoredTargetingSchema.safeParse(input);
  if (!parsed.success) {
    return DEFAULT_SPONSORED_TARGETING;
  }

  const cities = parsed.data.cities.includes(TEACHER_CAMPAIGN_ALL_CITIES)
    ? [TEACHER_CAMPAIGN_ALL_CITIES]
    : [...new Set(parsed.data.cities.filter((city) => city !== TEACHER_CAMPAIGN_ALL_CITIES))];

  return {
    ...parsed.data,
    cities: cities.length > 0 ? cities : [TEACHER_CAMPAIGN_ALL_CITIES],
    areaIds: [...new Set(parsed.data.areaIds)],
  };
}

export function gradeBandsForGradeLevel(gradeLevel: string | null | undefined, role: string | null | undefined) {
  if (role === "parent") {
    return ["veli"] as TeacherCampaignGradeBand[];
  }

  if (role !== "student" || !gradeLevel) {
    return [] as TeacherCampaignGradeBand[];
  }

  const match = gradeLevel.match(/(\d+)/);
  const grade = match ? Number(match[1]) : null;
  const bands: TeacherCampaignGradeBand[] = [];

  if (grade !== null && grade >= 1 && grade <= 4) bands.push("ilkokul");
  if (grade !== null && grade >= 5 && grade <= 8) {
    bands.push("ortaokul");
    if (grade >= 7) bands.push("lgs");
  }
  if (grade !== null && grade >= 9 && grade <= 12) {
    bands.push("lise");
    if (grade >= 11) bands.push("yks");
  }

  if (gradeLevel.toLowerCase().includes("okul öncesi") || gradeLevel.toLowerCase().includes("okul oncesi")) {
    bands.push("okul_oncesi");
  }

  return bands;
}

export function summarizeSponsoredTargeting(
  targeting: SponsoredCampaignTargeting,
  labels: {
    allTurkey: string;
    student: string;
    parent: string;
    explore: string;
    profileRail: string;
    feedHighlight: string;
    gradeBands: Record<TeacherCampaignGradeBand, string>;
  },
) {
  const placementLabels = targeting.placements.map((placement) => {
    if (placement === "explore") return labels.explore;
    if (placement === "profile_rail") return labels.profileRail;
    return labels.feedHighlight;
  });

  const cityLabel = targeting.cities.includes(TEACHER_CAMPAIGN_ALL_CITIES)
    ? labels.allTurkey
    : targeting.cities.join(", ");

  const roleLabels = targeting.roles.map((role) => (role === "student" ? labels.student : labels.parent));
  const gradeLabels = targeting.gradeBands.map((band) => labels.gradeBands[band]);

  return { placementLabels, cityLabel, roleLabels, gradeLabels };
}
