import type { UserRole } from "@/lib/supabase/database.types";

import { isPublisherRole } from "@/lib/domain/role-utils";

export function isStudentAccountRole(role: UserRole | null | undefined): role is "student" {
  return role === "student";
}

export function isParentAccountRole(role: UserRole | null | undefined): role is "parent" {
  return role === "parent";
}

export function shouldShowStudentHomeModules(role: UserRole | null | undefined): boolean {
  return role === "student";
}

export function shouldShowPublisherHomeInsights(role: UserRole | null | undefined): boolean {
  return Boolean(role && isPublisherRole(role));
}

export function shouldShowParentProfilesBridge(role: UserRole | null | undefined): boolean {
  return role === "parent";
}

export function shouldShowLearnerProfilesBridge(role: UserRole | null | undefined): boolean {
  return role === "student";
}

export function shouldShowPublisherProfilesBridge(role: UserRole | null | undefined): boolean {
  return Boolean(role && isPublisherRole(role));
}

export function getPublisherStudioHref(role: UserRole): "/teacher" | "/platform" {
  return role === "platform" ? "/platform" : "/teacher";
}

export function filterExploreCategories<T extends { query: string }>(
  categories: readonly T[],
  role: UserRole | null | undefined,
): T[] {
  if (role === "parent") return [...categories];
  return categories.filter((category) => category.query !== "Veli");
}

export function filterExploreTopicBridges<T extends { href: string }>(
  bridges: readonly T[],
  role: UserRole | null | undefined,
): T[] {
  if (!role || isStudentAccountRole(role) || isParentAccountRole(role)) {
    return [...bridges];
  }

  if (isPublisherRole(role)) {
    return bridges.filter((bridge) => bridge.href.startsWith("/questions") || bridge.href.startsWith("/explore"));
  }

  return [...bridges];
}

export function canCreateStoryFromFeed(role: UserRole | null | undefined, isVerified: boolean): boolean {
  return Boolean(role && isPublisherRole(role) && isVerified);
}

export function isVerifiedPublisherStoryAuthor(
  author: { is_verified?: boolean | null; role?: UserRole | null } | null | undefined,
): boolean {
  return Boolean(author?.is_verified && author.role && isPublisherRole(author.role));
}
