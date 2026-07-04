import { describe, expect, it } from "vitest";

import { assertModeratedOptionalText,ModerationRejectedError } from "@/lib/domain/moderation";
import {
  parentRedemptionDecisionSchema,
  redeemChildProductSchema,
  redeemProductSchema,
} from "@/lib/domain/store";

describe("store redeem validation", () => {
  it("accepts valid product redemption payload", () => {
    const parsed = redeemProductSchema.parse({
      productId: "00000000-0000-4000-8000-000000000601",
      note: "Kitap kuponu istiyorum",
    });
    expect(parsed.productId).toContain("00000000");
  });

  it("rejects invalid product ids", () => {
    expect(() =>
      redeemProductSchema.parse({
        productId: "not-a-uuid",
      }),
    ).toThrow();
  });

  it("accepts child redemption payload", () => {
    const parsed = redeemChildProductSchema.parse({
      productId: "00000000-0000-4000-8000-000000000601",
      childProfileId: "00000000-0000-4000-8000-000000000401",
    });
    expect(parsed.childProfileId).toContain("00000000");
  });

  it("moderates optional redemption notes", () => {
    expect(assertModeratedOptionalText("Veli onayı için not")).toBe("Veli onayı için not");
    expect(() => assertModeratedOptionalText("bu metin aptal")).toThrow(ModerationRejectedError);
  });

  it("allows empty notes", () => {
    const parsed = redeemProductSchema.parse({
      productId: "00000000-0000-4000-8000-000000000601",
    });
    expect(parsed.note).toBe("");
  });

  it("accepts parent redemption decisions", () => {
    const parsed = parentRedemptionDecisionSchema.parse({
      redemptionId: "00000000-0000-4000-8000-000000000901",
      status: "approved",
    });
    expect(parsed.status).toBe("approved");
  });
});
