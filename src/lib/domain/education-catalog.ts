export type GradeCategoryKey =
  | "preschool"
  | "primary"
  | "middle"
  | "high"
  | "parent"
  | "generalInterest"
  | "general";

export const GRADE_CATEGORY_ORDER: GradeCategoryKey[] = [
  "preschool",
  "primary",
  "middle",
  "high",
  "parent",
  "generalInterest",
  "general",
];

type EducationAreaLike = {
  id: number;
  area_name: string;
  age_group: string | null;
};

const GRADE_ALIASES: Record<string, GradeCategoryKey> = {
  "okul öncesi": "preschool",
  "1-4. sınıf": "primary",
  ilkokul: "primary",
  "5-8. sınıf": "middle",
  ortaokul: "middle",
  "8. sınıf": "middle",
  "5-8. sınıf (lgs)": "middle",
  "9-12. sınıf": "high",
  lise: "high",
  "12. sınıf": "high",
  "9-12. sınıf (yks)": "high",
  veli: "parent",
  "genel ilgi": "generalInterest",
  "ilkokul / ortaokul": "middle",
};

export function resolveGradeCategory(ageGroup: string | null | undefined): GradeCategoryKey {
  if (!ageGroup?.trim()) return "general";
  const normalized = ageGroup.trim().toLocaleLowerCase("tr-TR");
  return GRADE_ALIASES[normalized] ?? "general";
}

export function groupEducationAreasByGrade<T extends EducationAreaLike>(areas: T[]) {
  const groups = new Map<GradeCategoryKey, T[]>();

  for (const key of GRADE_CATEGORY_ORDER) {
    groups.set(key, []);
  }

  for (const area of areas) {
    const key = resolveGradeCategory(area.age_group);
    groups.get(key)?.push(area);
  }

  return GRADE_CATEGORY_ORDER.map((key) => ({
    key,
    areas: groups.get(key) ?? [],
  })).filter((group) => group.areas.length > 0);
}

export function detectBranchKey(areaName: string): string | null {
  const name = areaName.toLowerCase();
  if (name.includes("matematik")) return "math";
  if (name.includes("türkçe") || name.includes("turkce") || name.includes("edebiyat")) return "turkish";
  if (name.includes("fen") || name.includes("fizik") || name.includes("kimya") || name.includes("biyoloji")) return "science";
  if (name.includes("sosyal") || name.includes("tarih") || name.includes("coğrafya") || name.includes("cografya") || name.includes("inkılap")) return "social";
  if (name.includes("ingilizce") || name.includes("almanca") || name.includes("fransızca") || name.includes("fransizca")) return "languages";
  if (name.includes("kodlama") || name.includes("robotik") || name.includes("algoritma") || name.includes("teknoloji")) return "coding";
  if (name.includes("müzik") || name.includes("muzik")) return "music";
  if (name.includes("görsel") || name.includes("gorusel") || name.includes("sanat")) return "art";
  if (name.includes("beden")) return "pe";
  if (name.includes("din kültürü") || name.includes("din kulturu")) return "religion";
  if (name.includes("felsefe")) return "philosophy";
  if (name.includes("hayat bilgisi")) return "lifeScience";
  if (name.includes("sağlık") || name.includes("saglik")) return "health";
  if (name.includes("haber") || name.includes("gündem") || name.includes("gundem")) return "news";
  if (name.includes("spor") && !name.includes("futbol") && !name.includes("basketbol") && !name.includes("voleybol")) return "sports";
  if (name.includes("futbol")) return "football";
  if (name.includes("basketbol")) return "basketball";
  if (name.includes("voleybol")) return "volleyball";
  if (name.includes("genel kültür") || name.includes("genel kultur")) return "generalCulture";
  if (name.includes("psikoloji") || name.includes("iyi yaşam") || name.includes("iyi yasam")) return "wellbeing";
  if (name.includes("doğa") || name.includes("doga") || name.includes("çevre") || name.includes("cevre")) return "environment";
  if (name.includes("popüler bilim") || name.includes("populer bilim")) return "popularScience";
  if (name.includes("dini bilgi")) return "religiousKnowledge";
  if (name.includes("veli") || name.includes("ebeveyn")) return "parentGuide";
  if (name.includes("koçluk") || name.includes("kocluk")) {
    if (name.includes("yks")) return "yksCoaching";
    if (name.includes("lgs")) return "lgsCoaching";
    return "coaching";
  }
  if (name.includes("rehber öğretmen") || name.includes("rehber ogretmen") || name.includes("pdr")) return "guidanceTeacher";
  if (name.includes("bursluluk")) return "scholarshipExam";
  if (name.includes("ödev koç") || name.includes("odev koc")) return "homeworkCoaching";
  if (name.includes("çalışma teknik") || name.includes("calisma teknik") || name.includes("okuma alışkanlığı")) return "studySkills";
  if (name.includes("okuma")) return "literacy";
  return null;
}
