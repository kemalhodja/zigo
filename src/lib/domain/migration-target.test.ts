import { describe, expect, it } from "vitest";

import { LATEST_MIGRATION_FILE, MIGRATION_FILES, MIGRATION_TARGET } from "@/lib/domain/migration-target";

describe("migration-target", () => {
  it("tracks latest shipped migration prefix 086", () => {
    expect(MIGRATION_TARGET).toBe(86);
    expect(LATEST_MIGRATION_FILE).toBe("086_ai_mentor.sql");
    expect(MIGRATION_FILES).toContain("085_study_rooms.sql");
    expect(MIGRATION_FILES).toContain("086_ai_mentor.sql");
  });
});
