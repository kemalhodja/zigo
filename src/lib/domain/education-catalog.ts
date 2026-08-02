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
  "okul öncesi (4-6)": "preschool",
  "1. sınıf": "primary",
  "2. sınıf": "primary",
  "3. sınıf": "primary",
  "4. sınıf": "primary",
  "5. sınıf": "middle",
  "6. sınıf": "middle",
  "7. sınıf": "middle",
  "8. sınıf": "middle",
  "9. sınıf": "high",
  "10. sınıf": "high",
  "11. sınıf": "high",
  "12. sınıf": "high",
  "1-4. sınıf": "primary",
  ilkokul: "primary",
  "5-8. sınıf": "middle",
  ortaokul: "middle",
  "5-8. sınıf (lgs)": "middle",
  "9-12. sınıf": "high",
  lise: "high",
  "9-12. sınıf (yks)": "high",
  yks: "high",
  tyt: "high",
  ayt: "high",
  dgs: "high",
  ales: "high",
  kpss: "high",
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

  for (const [, groupAreas] of groups) {
    groupAreas.sort((a, b) =>
      displayEducationAreaName(a.area_name).localeCompare(
        displayEducationAreaName(b.area_name),
        "tr",
      ),
    );
  }

  return GRADE_CATEGORY_ORDER.map((key) => ({
    key,
    areas: groups.get(key) ?? [],
  })).filter((group) => group.areas.length > 0);
}

/** Strip grade/exam band prefixes — grade is chosen separately in the UI. */
const AREA_NAME_BAND_PREFIX =
  /^(?:\d{1,2}(?:-\d{1,2})?\.\s*Sınıf|Okul\s*Öncesi|İlkokul(?:\s*\/\s*Ortaokul)?|Ortaokul|Lise|LGS|YKS|TYT|AYT|DGS|ALES|KPSS)\s+/iu;

export function displayEducationAreaName(areaName: string | null | undefined): string {
  const raw = areaName?.trim() ?? "";
  if (!raw) return "";
  const cleaned = raw.replace(AREA_NAME_BAND_PREFIX, "").trim();
  return cleaned || raw;
}

export function detectBranchKey(areaName: string): string | null {
  const name = areaName.toLowerCase();
  if (name.includes("matematik")) return "math";
  if (name.includes("türkçe") || name.includes("turkce") || name.includes("edebiyat")) return "turkish";
  if (name.includes("fen") || name.includes("fizik") || name.includes("kimya") || name.includes("biyoloji")) return "science";
  if (name.includes("sosyal") || name.includes("tarih") || name.includes("coğrafya") || name.includes("cografya") || name.includes("inkılap") || name.includes("medeniyet") || name.includes("seyahat")) return "social";
  if (name.includes("ingilizce") || name.includes("almanca") || name.includes("fransızca") || name.includes("fransizca") || name.includes("dil öğren") || name.includes("dil ogren")) return "languages";
  if (name.includes("kodlama") || name.includes("yazılım") || name.includes("yazilim") || name.includes("robotik") || name.includes("algoritma") || name.includes("teknoloji") || name.includes("yapay zeka") || name.includes("stem")) return "coding";
  if (name.includes("müzik") || name.includes("muzik")) return "music";
  if (name.includes("görsel") || name.includes("gorusel") || name.includes("sanat") || name.includes("fotoğraf") || name.includes("fotograf") || name.includes("tasarım") || name.includes("tasarim")) return "art";
  if (name.includes("beden")) return "pe";
  if (name.includes("din kültürü") || name.includes("din kulturu")) return "religion";
  if (name.includes("felsefe") || name.includes("mantık") || name.includes("mantik")) return "philosophy";
  if (name.includes("hayat bilgisi")) return "lifeScience";
  if (name.includes("sağlık") || name.includes("saglik") || name.includes("beslenme") || name.includes("diyet")) return "health";
  if (name.includes("haber") || name.includes("gündem") || name.includes("gundem") || name.includes("medya") || name.includes("podcast") || name.includes("içerik üret") || name.includes("icerik uret")) return "news";
  if (name.includes("e-spor") || name.includes("espor")) return "esports";
  if (name.includes("tenis")) return "tennis";
  if (name.includes("yüzme") || name.includes("yuzme")) return "swimming";
  if (name.includes("satranç") || name.includes("satranc")) return "chess";
  if (name.includes("spor") && !name.includes("futbol") && !name.includes("basketbol") && !name.includes("voleybol")) return "sports";
  if (name.includes("futbol")) return "football";
  if (name.includes("basketbol")) return "basketball";
  if (name.includes("voleybol")) return "volleyball";
  if (name.includes("genel kültür") || name.includes("genel kultur")) return "generalCulture";
  if (name.includes("psikoloji") || name.includes("iyi yaşam") || name.includes("iyi yasam") || name.includes("motivasyon")) return "wellbeing";
  if (name.includes("doğa") || name.includes("doga") || name.includes("çevre") || name.includes("cevre") || name.includes("iklim") || name.includes("sürdürülebilir") || name.includes("surdurulebilir")) return "environment";
  if (name.includes("popüler bilim") || name.includes("populer bilim") || name.includes("astronomi")) return "popularScience";
  if (name.includes("dini bilgi")) return "religiousKnowledge";
  if (name.includes("veli") || name.includes("ebeveyn") || name.includes("çocuk geliş") || name.includes("cocuk gelis")) return "parentGuide";
  if (name.includes("eğitim ve pedagoji") || name.includes("egitim ve pedagoji") || name.includes("özel eğitim") || name.includes("ozel egitim")) return "pedagogy";
  if (name.includes("kariyer") || name.includes("meslek") || name.includes("üniversite") || name.includes("universite") || name.includes("tercih") || name.includes("burs")) return "career";
  if (name.includes("finans") || name.includes("girişim") || name.includes("girisim") || name.includes("hukuk")) return "lifeSkills";
  if (name.includes("kitap") || name.includes("okuma") || name.includes("yazarlık") || name.includes("yazarlik")) return "literacy";
  if (name.includes("koçluk") || name.includes("kocluk")) {
    if (name.includes("yks")) return "yksCoaching";
    if (name.includes("lgs")) return "lgsCoaching";
    return "coaching";
  }
  if (name.includes("rehber öğretmen") || name.includes("rehber ogretmen") || name.includes("pdr")) return "guidanceTeacher";
  if (name.includes("bursluluk")) return "scholarshipExam";
  if (name.includes("ödev koç") || name.includes("odev koc")) return "homeworkCoaching";
  if (name.includes("çalışma teknik") || name.includes("calisma teknik") || name.includes("okuma alışkanlığı") || name.includes("okuma aliskanligi")) return "studySkills";
  if (name.includes("okuma")) return "literacy";
  return null;
}
