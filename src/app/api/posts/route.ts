import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error: "Legacy posts API retired. Use GET /api/social/posts instead.",
      code: "LEGACY_POSTS_RETIRED",
      replacement: "/api/social/posts",
    },
    { status: 410 },
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Legacy posts API retired. Use POST /api/social/posts instead.",
      code: "LEGACY_POSTS_RETIRED",
      replacement: "/api/social/posts",
    },
    { status: 410 },
  );
}
