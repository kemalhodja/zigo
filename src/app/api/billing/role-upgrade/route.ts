import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2026-07-29.dahlia",
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountKind, organizationType } = (await request.json().catch(() => ({}))) as {
      accountKind?: string;
      organizationType?: string;
    };

    if (!accountKind) {
      return NextResponse.json({ error: "Missing accountKind" }, { status: 400 });
    }

    let requiresPayment = false;
    let requestId: string | null = null;
    let feeAmount = 500;

    const { data: subs } = await supabase
      .from("user_subscriptions")
      .select("current_period_end, tier")
      .eq("user_id", profile.id)
      .eq("tier", "zigo_plus")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (subs && subs.length > 0 && subs[0].current_period_end) {
      const periodEnd = new Date(subs[0].current_period_end);
      const now = new Date();
      if (periodEnd > now) {
        const remainingDays = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 3600 * 24));
        const dailyRate = 500 / 30;
        feeAmount = Math.max(100, Math.floor(remainingDays * dailyRate));
      }
    }

    try {
      const rpcUpdate = supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: Error | null }>;

      const { error } = await rpcUpdate("update_own_account_kind", {
        next_role: accountKind,
        next_organization_type: organizationType || undefined,
      });

      if (error) {
        if (error.message.includes("ROLE_CHANGE_REQUIRES_PAYMENT")) {
          requiresPayment = true;
        } else {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      if (msg.includes("ROLE_CHANGE_REQUIRES_PAYMENT")) {
        requiresPayment = true;
      } else {
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }

    if (requiresPayment) {
      const rpcRequest = supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: string | null; error: Error | null }>;

      const { data: requestData, error: requestError } = await rpcRequest("request_role_change", {
        next_role: accountKind,
        next_organization_type: organizationType || null,
      });

      if (requestError) {
        return NextResponse.json({ error: requestError.message }, { status: 400 });
      }
      
      requestId = requestData || "";

      const dbAdmin = (hasServiceRoleEnv() ? createAdminClient() : supabase)!;
      const dbTable = dbAdmin as unknown as {
        from: (table: string) => {
          update: (data: Record<string, unknown>) => {
            eq: (col: string, val: string) => Promise<unknown>;
          };
        };
      };

      await dbTable
        .from("role_change_requests")
        .update({ fee_amount: feeAmount })
        .eq("id", requestId);

      const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "https://zigo.app";
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: (await supabase.auth.getUser()).data.user?.email,
        client_reference_id: profile.id,
        line_items: [
          {
            price_data: {
              currency: "try",
              product_data: {
                name: "Zigo Rol Değişimi",
                description: `${profile.role} -> ${accountKind} geçiş ücreti`,
              },
              unit_amount: feeAmount * 100,
            },
            quantity: 1,
          },
        ],
        metadata: {
          roleChangeRequestId: requestId,
          userId: profile.id,
        },
        success_url: `${origin}/profile?upgrade_success=true`,
        cancel_url: `${origin}/profile?upgrade_canceled=true`,
      });

      await dbTable
        .from("role_change_requests")
        .update({ stripe_session_id: session.id })
        .eq("id", requestId);

      return NextResponse.json({
        requiresPayment: true,
        checkoutUrl: session.url,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Rol başarıyla değiştirildi",
    });

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sunucu hatası" },
      { status: 500 }
    );
  }
}
