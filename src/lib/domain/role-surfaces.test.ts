import { describe, expect, it } from "vitest";

import {
  filterExploreCategories,
  filterExploreTopicBridges,
  shouldShowParentProfilesBridge,
  shouldShowPublisherHomeInsights,
  shouldShowStudentHomeModules,
} from "@/lib/domain/role-surfaces";

describe("role-surfaces", () => {
  const categories = [
    { label: "For you", query: "" },
    { label: "Parent", query: "Veli" },
  ];

  const bridges = [
    { href: "/explore?q=math", label: "Explore" },
    { href: "/learn", label: "Learn" },
    { href: "/questions", label: "Ask" },
  ];

  it("shows student home modules only for students", () => {
    expect(shouldShowStudentHomeModules("student")).toBe(true);
    expect(shouldShowStudentHomeModules("parent")).toBe(false);
    expect(shouldShowStudentHomeModules("teacher")).toBe(false);
    expect(shouldShowStudentHomeModules(null)).toBe(false);
  });

  it("shows publisher insights for teacher and platform roles", () => {
    expect(shouldShowPublisherHomeInsights("teacher")).toBe(true);
    expect(shouldShowPublisherHomeInsights("platform")).toBe(true);
    expect(shouldShowPublisherHomeInsights("student")).toBe(false);
  });

  it("hides parent-only explore category from non-parent roles", () => {
    expect(filterExploreCategories(categories, "student")).toHaveLength(1);
    expect(filterExploreCategories(categories, "parent")).toHaveLength(2);
  });

  it("limits publisher explore bridges to creator-relevant loops", () => {
    expect(filterExploreTopicBridges(bridges, "teacher")).toEqual([
      bridges[0],
      bridges[2],
    ]);
    expect(filterExploreTopicBridges(bridges, "student")).toEqual(bridges);
  });

  it("shows parent profile bridge only for parents", () => {
    expect(shouldShowParentProfilesBridge("parent")).toBe(true);
    expect(shouldShowParentProfilesBridge("student")).toBe(false);
  });
});
