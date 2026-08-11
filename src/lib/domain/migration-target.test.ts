import { describe, expect, it } from "vitest";

import { LATEST_MIGRATION_FILE, MIGRATION_FILES, MIGRATION_TARGET } from "@/lib/domain/migration-target";

describe("migration-target", () => {
  it("tracks latest shipped migration prefix 089", () => {
    expect(MIGRATION_TARGET).toBe(89);
    expect(LATEST_MIGRATION_FILE).toBe("089_explore_discover_posts.sql");
    expect(MIGRATION_FILES).toContain("085_study_rooms.sql");
    expect(MIGRATION_FILES).toContain("089_explore_discover_posts.sql");
  });
});
