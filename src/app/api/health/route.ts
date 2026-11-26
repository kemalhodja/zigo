import { NextResponse } from "next/server";

import { APP_VERSION } from "@/lib/app-links";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      status: "healthy",
      appVersion: APP_VERSION,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
