export {
  findBestTeachers,
  upsertStudentNeed,
} from "@/lib/domain/ecosystem/matching";

export { getParentWeeklyProgressSummary } from "@/lib/domain/ecosystem/reporting";

export {
  analyzeWeaknesses,
  detectWeaknessesFromSessions,
  mergeRecentAssessmentSessions,
  scoreToWeaknessLevel,
  type AssessmentSession,
  type DetectedWeakness,
  type WeaknessAnalysisResult,
} from "./weakness-analysis.service";

export {
  getSmartRecommendations,
  getTeachersForSubject,
  type SmartRecommendationsResult,
} from "./recommendations.service";
