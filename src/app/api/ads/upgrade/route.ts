/**
 * POST /api/ads/upgrade
 * 
 * Upgrades user to premium subscription.
 * Body: { userId }
 */

import { NextResponse } from "next/server";

import { upgradeToPremium } from "@/lib/server/ad-state-manager";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const success = await upgradeToPremium(userId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to upgrade to premium" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully upgraded to premium",
    });
  } catch (error) {
    console.error("Error upgrading to premium:", error);
    return NextResponse.json(
      { error: "Failed to upgrade to premium" },
      { status: 500 }
    );
  }
}