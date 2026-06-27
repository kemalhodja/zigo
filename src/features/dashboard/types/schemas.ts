import { z } from "zod";

export const weeklyProgressSummarySchema = z.object({
  reportCount: z.number().int().nonnegative(),
  averageScore: z.number().nullable(),
  topAreaName: z.string().nullable(),
  completedBookings: z.number().int().nonnegative(),
});

export type WeeklyProgressSummary = z.infer<typeof weeklyProgressSummarySchema>;
