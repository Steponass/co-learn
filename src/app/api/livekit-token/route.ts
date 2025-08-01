import { NextRequest, NextResponse } from "next/server";
import { createLiveKitToken } from "@/app/api/livekit-token/livekit-token";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get("room");
  const user = searchParams.get("user");

  console.log("[LiveKit Token API] Request received:", { room, user });

  if (!room || !user) {
    console.error("[LiveKit Token API] Missing required parameters");
    return NextResponse.json(
      { error: "Missing room or user parameter" },
      { status: 400 }
    );
  }

  try {
    // Token generation is now async
    const token = await createLiveKitToken({ 
      roomName: room, 
      userName: user 
    });
    
    console.log("[LiveKit Token API] Token generated successfully for room:", room);
    
    return NextResponse.json({ token });
  } catch (error) {
    console.error("[LiveKit Token API] Token generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate token", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}