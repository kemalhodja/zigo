import { describe, expect, it } from "vitest";

import { assertModeratedOptionalText,ModerationRejectedError } from "@/lib/domain/moderation";
import {
  createProfileSchema,
  isStudentDocumentApproved,
  setInterestsSchema,
  updateUserProfileSchema,
} from "@/lib/domain/profiles";

describe("profiles schemas and gates", () => {
  it("accepts valid profile creation payload", () => {
    const parsed = createProfileSchema.parse({
      fullName: "Zeynep Yılmaz",
      role: "student",
    });
    expect(parsed.role).toBe("student");
  });

  it("rejects profile names that are too short", () => {
    expect(() =>
      createProfileSchema.parse({
        fullName: "A",
        role: "parent",
      }),
    ).toThrow();
  });

  it("requires at least one education area interest", () => {
    expect(() => setInterestsSchema.parse({ areaIds: [] })).toThrow();
  });

  it("requires bio or avatarUrl for profile updates", () => {
    expect(() => updateUserProfileSchema.parse({})).toThrow();
  });

  it("accepts safe bio updates in schema", () => {
    const parsed = updateUserProfileSchema.parse({
      bio: "7. sınıf matematik çalışıyorum.",
    });
    expect(parsed.bio).toBe("7. sınıf matematik çalışıyorum.");
  });

  it("blocks profane bios through moderation helper", () => {
    expect(() => assertModeratedOptionalText("bu metin aptal")).toThrow(ModerationRejectedError);
  });

  it("approves student document gate only when approved", () => {
    expect(
      isStudentDocumentApproved({ role: "student", student_document_status: "approved" }),
    ).toBe(true);
    expect(
      isStudentDocumentApproved({ role: "student", student_document_status: "pending" }),
    ).toBe(false);
    expect(isStudentDocumentApproved({ role: "parent", student_document_status: null })).toBe(true);
  });
});
