import { describe, expect, it, vi } from "vitest";

import { DomainForbiddenError } from "@/lib/domain/domain-errors";
import { ModerationRejectedError } from "@/lib/domain/moderation";
import {
  assertUserCanPublishSocialContent,
  ModerationPolicyBlockedError,
  raiseModerationPolicyError,
} from "@/lib/domain/moderation-policy";

describe("moderation policy", () => {
  it("blocks users with social interactions disabled", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { social_interactions_blocked: true },
              error: null,
            }),
          })),
        })),
      })),
    };

    await expect(assertUserCanPublishSocialContent(supabase as never, "user-1")).rejects.toBeInstanceOf(
      DomainForbiddenError,
    );
  });

  it("creates a first-warning policy error and reports to admin", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: { action: "warned", strike_count: 1, restricted: false },
        error: null,
      }),
    };

    const error = new ModerationRejectedError("obscenity", "porno");
    const policyError = await raiseModerationPolicyError(supabase as never, error, {
      contentKind: "comment",
      contentPreview: "porno izle",
    });

    expect(policyError).toBeInstanceOf(ModerationPolicyBlockedError);
    expect(policyError.strikeCount).toBe(1);
    expect(policyError.isFirstWarning).toBe(true);
    expect(policyError.message).toContain("ilk uyarın");
    expect(supabase.rpc).toHaveBeenCalledWith("record_moderation_violation", {
      p_reason: "obscenity",
      p_content_kind: "comment",
      p_content_preview: "porno izle",
      p_matched_term: "porno",
    });
  });

  it("creates a restricted policy error on repeat offense", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: { action: "restricted", strike_count: 2, restricted: true },
        error: null,
      }),
    };

    const error = new ModerationRejectedError("profanity", "aptal");
    const policyError = await raiseModerationPolicyError(supabase as never, error, {
      contentKind: "comment",
      contentPreview: "aptal yorum",
    });

    expect(policyError.restricted).toBe(true);
    expect(policyError.message).toContain("kapatıldı");
  });
});
