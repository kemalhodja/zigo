export {
  getSmartRecommendations,
  getTeachersForSubject,
  type SmartRecommendationsResult,
} from "./recommendations.service";
export {
  analyzeWeaknesses,
  type AssessmentSession,
  type DetectedWeakness,
  detectWeaknessesFromSessions,
  mergeRecentAssessmentSessions,
  scoreToWeaknessLevel,
  type WeaknessAnalysisResult,
} from "./weakness-analysis.service";
export {
  findBestTeachers,
  upsertStudentNeed,
} from "@/lib/domain/ecosystem/matching";
export { getParentWeeklyProgressSummary } from "@/lib/domain/ecosystem/reporting";
