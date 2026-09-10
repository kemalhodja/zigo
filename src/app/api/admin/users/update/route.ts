import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePlatformAdmin } from "@/lib/domain/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  role: z
    .enum([
      "student",
      "teacher",
      "parent",
      "education_institution",
      "education_platform",
      "publisher",
      "admin",
    ])
    .optional(),
  isVerified: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  accountStatus: z.enum(["active", "suspended", "limited", "closed"]).optional(),
  teacherCreatorPlus: z.boolean().optional(),
  organizationType: z.string().nullable().optional(),
  moderationStrikes: z.number().int().min(0).max(10).optional(),
  socialInteractionsBlocked: z.boolean().optional(),
  fullName: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).nullable().optional(),
  websiteUrl: z.string().max(2048).nullable().optional(),
  youtubeUrl: z.string().max(2048).nullable().optional(),
  instagramUrl: z.string().max(2048).nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth) {
      return auth.error;
    }

    const json = await request.json().catch(() => ({}));
    const body = updateUserSchema.parse(json);

    const adminClient = createAdminClient() ?? auth.supabase;
    const updatePayload: Record<string, unknown> = {};

    if (body.role !== undefined) {
      updatePayload.role = body.role;
    }
    if (body.isVerified !== undefined) {
      updatePayload.is_verified = body.isVerified;
    }
    if (body.isPremium !== undefined) {
      updatePayload.is_premium = body.isPremium;
    }
    if (body.accountStatus !== undefined) {
      updatePayload.account_status = body.accountStatus;
    }
    if (body.teacherCreatorPlus !== undefined) {
      updatePayload.teacher_creator_plus = body.teacherCreatorPlus;
    }
    if (body.organizationType !== undefined) {
      updatePayload.organization_type = body.organizationType;
    }
    if (body.moderationStrikes !== undefined) {
      updatePayload.social_safety_strike_count = body.moderationStrikes;
      // If strikes reduced to 0, automatically unblock interactions if not explicitly set
      if (body.moderationStrikes === 0 && body.socialInteractionsBlocked === undefined) {
        updatePayload.social_interactions_blocked = false;
        updatePayload.social_interactions_blocked_at = null;
      }
    }
    if (body.socialInteractionsBlocked !== undefined) {
      updatePayload.social_interactions_blocked = body.socialInteractionsBlocked;
      if (!body.socialInteractionsBlocked) {
        updatePayload.social_interactions_blocked_at = null;
      } else {
        updatePayload.social_interactions_blocked_at = new Date().toISOString();
      }
    }
    if (body.fullName !== undefined) {
      updatePayload.full_name = body.fullName;
    }
    if (body.bio !== undefined) {
      updatePayload.bio = body.bio;
    }
    if (body.websiteUrl !== undefined) {
      updatePayload.website_url = body.websiteUrl;
    }
    if (body.youtubeUrl !== undefined) {
      updatePayload.youtube_url = body.youtubeUrl;
    }
    if (body.instagramUrl !== undefined) {
      updatePayload.instagram_url = body.instagramUrl;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedUser, error } = await (adminClient as any)
      .from("users")
      .update(updatePayload)
      .eq("id", body.userId)
      .select("*")
      .single();

    if (error) {
      console.error("[ADMIN_UPDATE_USER_ERROR]", error);
      return NextResponse.json({ error: error.message || "Kullanıcı güncellenemedi." }, { status: 400 });
    }

    // Sync subscription tier RPC if premium status was toggled
    if (body.isPremium !== undefined) {
      try {
        await adminClient.rpc("set_user_subscription_tier", {
          p_user_id: body.userId,
          p_tier: body.isPremium ? "zigo_plus" : "free",
        });
      } catch {
        // Non-fatal, users.is_premium is already updated directly
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "Kullanıcı özellikleri başarıyla güncellendi.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz güncelleme parametreleri.", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Güncelleme sırasında bir hata oluştu.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
