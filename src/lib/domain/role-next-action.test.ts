import { describe, expect, it } from "vitest";

import { resolveRoleNextAction, resolveWrongRoleStudioHref } from "@/lib/domain/role-next-action";

const labels = {
  student: { title: "S", hint: "sh", cta: "sc" },
  parent: { title: "P", hint: "ph", cta: "pc" },
  teacher: { title: "T", hint: "th", cta: "tc" },
  teacherLocked: { title: "TL", hint: "tlh", cta: "tlc" },
  guest: { title: "G", hint: "gh", cta: "gc" },
};

describe("role-next-action", () => {
  it("routes each role to a single primary job", () => {
    expect(resolveRoleNextAction("student", false, labels).href).toBe("/learn");
    expect(resolveRoleNextAction("parent", false, labels).href).toBe("/parent");
    expect(resolveRoleNextAction("teacher", true, labels).href).toBe("/create");
    expect(resolveRoleNextAction("teacher", false, labels).href).toBe("/teacher");
    expect(resolveRoleNextAction("guest", false, labels).href).toBe("/auth");
  });

  it("never sends non-teachers to create from wrong-role studio", () => {
    expect(resolveWrongRoleStudioHref("student")).toBe("/student");
    expect(resolveWrongRoleStudioHref("parent")).toBe("/parent");
    expect(resolveWrongRoleStudioHref("guest")).toBe("/auth");
  });
});
