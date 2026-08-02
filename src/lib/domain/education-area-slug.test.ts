import { describe, expect, it } from "vitest";

import { matchAreaBySlug, slugifyEducationArea } from "@/lib/domain/education-area-slug";

describe("education-area-slug", () => {
  it("slugifies Turkish area names", () => {
    expect(slugifyEducationArea("LGS Matematik")).toBe("lgs-matematik");
  });

  it("matches areas by slug", () => {
    const areas = [{ area_name: "YKS Fizik" }, { area_name: "LGS Fen Bilimleri" }];
    expect(matchAreaBySlug(areas, "yks-fizik")?.area_name).toBe("YKS Fizik");
    expect(matchAreaBySlug(areas, "missing")).toBeNull();
  });
});
