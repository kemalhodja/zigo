import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePlatformAdmin } from "@/lib/domain/admin-auth";
import {
  adminBillingGrantSchema,
  recordAdminBillingGrant,
  resolveAdminGrantPeriodEnd,
} from "@/lib/domain/admin-billing-grant";
import { activateZigoPlus } from "@/lib/domain/billing";
import { activateSponsorBoost } from "@/lib/domain/sponsor-activation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if (auth.error) return auth.error;

    const body = adminBillingGrantSchema.parse(await request.json().catch(() => ({})));
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Service role required to grant billing entitlements." },
        { status: 503 },
      );
    }

    const { data: target, error: targetError } = await admin
      .from("users")
      .select("id, full_name, email, role")
      .eq("id", body.userId)
      .maybeSingle();

    if (targetError) throw targetError;
    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (body.kind === "plus") {
      const currentPeriodEnd = resolveAdminGrantPeriodEnd(body.periodDays);
      const data = await activateZigoPlus(admin, body.userId, { currentPeriodEnd });
      await recordAdminBillingGrant(admin, {
        adminId: auth.profile.id,
        grant: body,
        periodEndsAt: currentPeriodEnd,
      });
      return NextResponse.json({
        data: {
          kind: "plus",
          userId: body.userId,
          fullName: target.full_name,
          currentPeriodEnd,
          subscription: data,
        },
      });
    }

    if (target.role !== "teacher") {
      return NextResponse.json(
        { error: "Sponsor grants require a teacher / organization profile." },
        { status: 400 },
      );
    }

    const result = await activateSponsorBoost(admin, {
      userId: body.userId,
      fullName: target.full_name,
      packageDays: body.packageDays,
    });

    await recordAdminBillingGrant(admin, {
      adminId: auth.profile.id,
      grant: body,
      periodEndsAt: result.expiresAt,
    });

    return NextResponse.json({
      data: {
        kind: "sponsor",
        userId: body.userId,
        fullName: target.full_name,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid billing grant request." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Billing grant failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
