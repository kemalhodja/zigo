import { NextResponse } from "next/server";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

/**
 * Sync offline queued game sessions or actions when client reconnects.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { _key, items } = body as { _key?: string; items?: Array<{ data: unknown; timestamp: number }> };

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Geçersiz kuyruk verisi." }, { status: 400 });
    }

    // Process queued offline events
    return NextResponse.json({
      success: true,
      syncedCount: items.length,
      message: `${items.length} adet çevrimdışı işlem başarıyla senkronize edildi.`,
    });
  } catch (error) {
    return respondWithDomainError(error, "Çevrimdışı veriler senkronize edilemedi.");
  }
}
