import { describe, expect, it } from "vitest";

import {
  CURRICULUM_TOPICS,
  getAllTopics,
  getGroupedSubjects,
  getTopicByParams,
  getTopicsByExam,
} from "./curriculum-topics";

describe("curriculum-topics", () => {
  it("contains unique (exam, subjectSlug, topicSlug) paths", () => {
    const keys = new Set<string>();
    for (const topic of CURRICULUM_TOPICS) {
      const key = `${topic.exam}/${topic.subjectSlug}/${topic.topicSlug}`;
      expect(keys.has(key)).toBe(false);
      keys.add(key);

      expect(topic.keyPoints.length).toBeGreaterThan(0);
      expect(topic.commonMistakes.length).toBeGreaterThan(0);
      expect(topic.questions.length).toBeGreaterThan(0);
      for (const q of topic.questions) {
        expect(q.options).toHaveLength(4);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThanOrEqual(3);
        expect(q.explanation.length).toBeGreaterThan(5);
      }
    }
  });

  it("looks up topics by exam, subject, and slug", () => {
    expect(getAllTopics().length).toBe(CURRICULUM_TOPICS.length);
    expect(getTopicsByExam("lgs").length).toBeGreaterThan(10);
    expect(getTopicsByExam("yks").length).toBeGreaterThan(10);

    const found = getTopicByParams("lgs", "matematik", "uslu-ifadeler");
    expect(found).not.toBeNull();
    expect(found?.title).toContain("Üslü İfadeler");

    expect(getTopicByParams("lgs", "matematik", "olmayan-konu")).toBeNull();
    expect(getGroupedSubjects("yks").length).toBeGreaterThanOrEqual(3);
  });
});
