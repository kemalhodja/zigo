import { describe, expect, it } from "vitest";

import { buildSetupFirstTenPaths, resolveLiveGateFixHref } from "@/lib/domain/setup-first-ten";

describe("setup-first-ten", () => {
  it("builds three role paths with three steps each", () => {
    const paths = buildSetupFirstTenPaths({
      teacherSteps: ["a", "b", "c"],
      parentSteps: ["d", "e", "f"],
      studentSteps: ["g", "h", "i"],
    });

    expect(paths).toHaveLength(3);
    expect(paths.map((path) => path.role)).toEqual(["teacher", "parent", "student"]);
    expect(paths[0]?.href).toBe("/teacher");
    expect(paths[1]?.href).toBe("/parent");
    expect(paths[2]?.href).toBe("/micro");
    expect(paths.every((path) => path.steps.length === 3)).toBe(true);
  });

  it("maps failing live gates to fix anchors", () => {
    expect(resolveLiveGateFixHref("schema_social")).toBe("/setup#migrations");
    expect(resolveLiveGateFixHref("site_url")).toBe("/setup#hosted-deploy");
    expect(resolveLiveGateFixHref("registration_matrix")).toBe("/auth");
    expect(resolveLiveGateFixHref("unknown")).toBeUndefined();
  });
});
