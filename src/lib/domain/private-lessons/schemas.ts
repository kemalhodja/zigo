import { z } from "zod";

export const createPrivateLessonPostSchema = z.object({
  areaId: z.number().int().positive("Lütfen geçerli bir branş seçin."),
  gradeLevel: z.string().min(1, "Lütfen sınıf/seviye belirtin."),
  mode: z.enum(["online", "in_person", "both"] as const),
  city: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  description: z
    .string()
    .min(15, "Lütfen ders ihtiyacını en az 15 karakterle detaylıca açıklayın.")
    .max(1500, "Açıklama 1500 karakterden uzun olamaz."),
  budgetTry: z.number().positive().optional().nullable(),
  childProfileId: z.string().uuid().optional().nullable(),
});

export const createPrivateLessonBidSchema = z.object({
  postId: z.string().uuid("Geçersiz ilan ID."),
  pricePerHourTry: z
    .number()
    .positive("Saatlik ücret 0'dan büyük olmalıdır.")
    .max(50000, "Lütfen makul bir saatlik ücret girin."),
  message: z
    .string()
    .min(10, "Teklif açıklamanız en az 10 karakter olmalıdır.")
    .max(1000, "Teklif açıklaması 1000 karakterden uzun olamaz."),
});

export type CreatePrivateLessonPostInput = z.infer<typeof createPrivateLessonPostSchema>;
export type CreatePrivateLessonBidInput = z.infer<typeof createPrivateLessonBidSchema>;

export type PrivateLessonPostWithDetails = {
  id: string;
  parent_id: string;
  child_profile_id: string | null;
  area_id: number;
  grade_level: string;
  mode: "online" | "in_person" | "both";
  city: string | null;
  district: string | null;
  description: string;
  budget_try: number | null;
  status: "open" | "closed" | "completed";
  bids_count: number;
  created_at: string;
  area?: { id: number; area_name: string } | null;
  parent?: { id: string; full_name: string | null; avatar_url: string | null } | null;
  child_profile?: { id: string; name: string } | null;
  my_bid?: PrivateLessonBidWithTeacher | null;
};

export type PrivateLessonBidWithTeacher = {
  id: string;
  post_id: string;
  teacher_id: string;
  price_per_hour_try: number;
  message: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  teacher?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    role: string;
  } | null;
};
