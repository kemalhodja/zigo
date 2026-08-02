import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await request.json();

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
    }

    // SIMULATION (Mock Mode)
    // Normally we would use 'livekit-server-sdk' here to generate an AccessToken.
    // e.g., const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity: user.id });
    // at.addGrant({ roomJoin: true, room: roomId, canPublish: true, canSubscribe: true });
    // const token = at.toJwt();

    const mockToken = `mock-jwt-token-for-room-${roomId}-user-${user.id}`;
    const mockUrl = "wss://mock-livekit-server.zigo.app";

    return NextResponse.json({ token: mockToken, serverUrl: mockUrl });
  } catch (error) {
    console.error("Room token error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
