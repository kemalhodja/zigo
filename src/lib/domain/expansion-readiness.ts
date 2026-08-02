import { LAUNCH_COVERAGE_TARGET } from "@/lib/domain/launch-scope";
import { LEARNING_RETENTION_TARGET } from "@/lib/domain/learning-retention";

export type ExpansionSignalId = "feedCoverage" | "moderationSla" | "learningRetention";

export type ExpansionSignal = {
  id: ExpansionSignalId;
  ready: boolean;
};

export type ExpansionReadiness = {
  ready: boolean;
  readyCount: number;
  totalCount: number;
  signals: ExpansionSignal[];
  feedCoverageRatio: number;
  moderationBreaches: number;
  learningRetentionRatio: number;
  learningCohortSize: number;
};

export function evaluateExpansionReadiness(input: {
  feedCoverageRatio: number;
  moderationOnTarget: boolean;
  moderationBreaches: number;
  learningRetentionRatio: number;
  learningCohortSize: number;
}): ExpansionReadiness {
  const signals: ExpansionSignal[] = [
    {
      id: "feedCoverage",
      ready: input.feedCoverageRatio >= LAUNCH_COVERAGE_TARGET,
    },
    {
      id: "moderationSla",
      ready: input.moderationOnTarget,
    },
    {
      id: "learningRetention",
      ready:
        input.learningCohortSize === 0
          ? false
          : input.learningRetentionRatio >= LEARNING_RETENTION_TARGET,
    },
  ];

  const readyCount = signals.filter((signal) => signal.ready).length;
  return {
    ready: readyCount === signals.length,
    readyCount,
    totalCount: signals.length,
    signals,
    feedCoverageRatio: input.feedCoverageRatio,
    moderationBreaches: input.moderationBreaches,
    learningRetentionRatio: input.learningRetentionRatio,
    learningCohortSize: input.learningCohortSize,
  };
}
