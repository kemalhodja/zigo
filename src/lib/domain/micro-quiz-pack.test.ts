import { describe, expect, it } from "vitest";

import { isMicroQuizPack, resolveCreatePackHref } from "@/lib/domain/micro-quiz-pack";

describe("micro-quiz-pack", () => {
  it("recognizes the micro-quiz pack", () => {
    expect(isMicroQuizPack("micro-quiz")).toBe(true);
    expect(isMicroQuizPack("other")).toBe(false);
    expect(resolveCreatePackHref("micro-quiz")?.quiz).toContain("pack=micro-quiz");
  });
});
