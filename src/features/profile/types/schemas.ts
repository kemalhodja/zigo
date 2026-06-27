import { z } from "zod";

export {
  createProfileSchema,
  setInterestsSchema,
  setOrganizationTypeSchema,
  updateUserProfileSchema,
  type UserProfile,
} from "@/lib/domain/profiles";

export const userRoleSchema = z.enum(["teacher", "parent", "student"]);

export const profileResponseSchema = z.object({
  data: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    full_name: z.string(),
    role: userRoleSchema,
    is_verified: z.boolean(),
  }),
});

export type UserRoleValue = z.infer<typeof userRoleSchema>;
