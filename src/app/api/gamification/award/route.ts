import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Direct point awards are disabled. Earn Zigo points through verified reels, videos, quizzes or parent-confirmed child learning.",
    },
    { status: 410 },
  );
}
