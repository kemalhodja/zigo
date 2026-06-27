import { z } from "zod";

import type { StandardErrorBody } from "@/features/shared/errors/types";

export const standardErrorBodySchema = z.object({
  error: z.string(),
  code: z.string(),
  retryAfterSeconds: z.number().optional(),
  details: z.unknown().optional(),
});

export function createDataResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    data: dataSchema,
  });
}

export type ApiErrorResponse = StandardErrorBody;
