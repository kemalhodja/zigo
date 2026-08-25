import { describe, expect, it } from "vitest";

import {
  buildPlanPrompt,
  buildRuleBasedPlan,
  parseAiPlan,
  type PlanContext,
} from "@/lib/domain/study-plan";

const baseCtx: PlanContext = {
  displayName: "Mert",
  weeklyFocusMinutes: 120,
  dueReviewCount: 3,
  reviewSampleTopics: ["Denklem: x'i yalnız bırak", "Üslü ifadeler"],
  quizCount7d: 2,
  gamePlays7d: 1,
};

describe("buildPlanPrompt", () => {
  it("embeds telemetry into the user prompt", () => {
    const { user } = buildPlanPrompt(baseCtx);
    expect(user).toContain("120 dakika");
    expect(user).toContain("Denklem");
    expect(user).not.toContain("az çalışmış");
  });

  it("flags low-activity students for gentler plans", () => {
    const low: PlanContext = { ...baseCtx, weeklyFocusMinutes: 10 };
    const { user } = buildPlanPrompt(low);
    expect(user).toContain("az çalışmış");
  });
});

describe("buildRuleBasedPlan", () => {
  it("prioritizes due reviews when they exist", () => {
    const plan = buildRuleBasedPlan(baseCtx);
    expect(plan.blocks[0].subject).toBe("Tekrar");
    expect(plan.source).toBe("rule");
    expect(plan.blocks.length).toBeGreaterThanOrEqual(2);
  });

  it("always includes a focus block and stays within bounds", () => {
    const empty: PlanContext = { ...baseCtx, dueReviewCount: 0, quizCount7d: 5, gamePlays7d: 5 };
    const plan = buildRuleBasedPlan(empty);
    expect(plan.blocks.some((b) => b.subject === "Çalışma")).toBe(true);
    for (const block of plan.blocks) {
      expect(block.minutes).toBeGreaterThanOrEqual(5);
      expect(block.minutes).toBeLessThanOrEqual(180);
    }
  });
});

describe("parseAiPlan", () => {
  it("parses valid JSON wrapped in prose or code fences", () => {
    const raw = 'İşte planın:\n```json\n{"summary":"Bugün odak günü","blocks":[{"timeLabel":"Sabah","subject":"Matematik","task":"20 denklem sorusu","minutes":45},{"timeLabel":"Akşam","subject":"Tekrar","task":"Yanlış kartlarını çevir","minutes":15}],"motivation":"Hadi!"}\n```';
    const plan = parseAiPlan(raw);
    expect(plan?.source).toBe("ai");
    expect(plan?.blocks[0].minutes).toBe(45);
  });

  it("returns null on invalid payloads (missing blocks, wrong types)", () => {
    expect(parseAiPlan("selam")).toBeNull();
    expect(parseAiPlan('{"summary":"x","blocks":[],"motivation":"y"}')).toBeNull();
    expect(
      parseAiPlan('{"summary":"x","blocks":[{"timeLabel":1,"subject":"a","task":"b","minutes":"c"}],"motivation":"y"}'),
    ).toBeNull();
  });
});
