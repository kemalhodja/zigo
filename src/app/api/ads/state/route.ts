/**
 * GET /api/ads/state
 * 
 * Returns the ad state for a given user ID.
 * Query params: userId
 */

import { NextResponse } from "next/server";
import { isUserAdFree } from "@/lib/server/ad-state-manager";

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

    const adState = await isUserAdFree(userId);

    return NextResponse.json(adState);
  } catch (error) {
    console.error("Error fetching ad state:", error);
    return NextResponse.json(
      { error: "Failed to fetch ad state" },
      { status: 500 }
    );
  }
}