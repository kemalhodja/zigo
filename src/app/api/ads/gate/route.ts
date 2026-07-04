/**
 * GET /api/ads/gate
 * 
 * Checks if user can proceed with a gated action (e.g., share reel, create post).
 * Query params: userId
 */

import { NextResponse } from "next/server";
import { checkAdGate } from "@/lib/server/ad-state-manager";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const gateResult = await checkAdGate(userId);

    return NextResponse.json(gateResult);
  } catch (error) {
    console.error("Error checking ad gate:", error);
    return NextResponse.json(
      { error: "Failed to check ad gate" },
      { status: 500 }
    );
  }
}