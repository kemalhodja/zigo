import { describe, expect, it } from "vitest";

import { LATEST_MIGRATION_FILE, MIGRATION_FILES, MIGRATION_TARGET } from "@/lib/domain/migration-target";

describe("migration-target", () => {
  it("tracks latest shipped migration prefix 118", () => {
    expect(MIGRATION_TARGET).toBe(118);
    expect(LATEST_MIGRATION_FILE).toBe("118_user_feedback.sql");
    expect(MIGRATION_FILES).toContain("085_study_rooms.sql");
    expect(MIGRATION_FILES).toContain("091_push_subscriptions.sql");
    expect(MIGRATION_FILES).toContain("118_user_feedback.sql");
  });
});
