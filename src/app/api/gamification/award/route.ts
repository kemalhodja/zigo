import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Direct point awards are disabled to enforce server-side learning event security." },
    { status: 410 }
  );
}
