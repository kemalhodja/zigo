/**
 * POST /api/ads/watch
 * 
 * Processes a watched rewarded ad and grants ad-free time.
 * Body: { userId, hoursToAdd? }
 */

import { NextResponse } from "next/server";
import { grantAdFreeTime } from "@/lib/server/ad-state-manager";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, hoursToAdd = 2 } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const result = await grantAdFreeTime(userId, hoursToAdd);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to process ad watch" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      adFreeUntil: result.adFreeUntil,
      hoursGranted: result.hoursGranted,
    });
  } catch (error) {
    console.error("Error processing ad watch:", error);
    return NextResponse.json(
      { error: "Failed to process ad watch" },
      { status: 500 }
    );
  }
}