import { z } from "zod";

import { updateGradeLevelSchema } from "@/lib/domain/grade-level";
import { isRegistrationAccountKind } from "@/lib/domain/registration-account";
import { shortcutPreferencesSchema } from "@/lib/domain/shortcut-preferences";

export {
  createProfileSchema,
  setInterestsSchema,
  setOrganizationTypeSchema,
  updateUserProfileSchema,
} from "@/lib/domain/profiles";

export const createProfileBodySchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  role: z.enum(["teacher", "parent", "student"]).optional(),
  accountKind: z.string().optional(),
});

export const updateProfileBodySchema = z.object({
  bio: z.string().trim().max(500).optional(),
  avatarUrl: z.string().trim().url().max(500).optional(),
});

export const updateGradeLevelBodySchema = updateGradeLevelSchema;

export const updateShortcutPreferencesBodySchema = shortcutPreferencesSchema;

export function parseRegistrationAccountKind(value: unknown) {
  if (typeof value !== "string") return undefined;
  return isRegistrationAccountKind(value) ? value : undefined;
}
