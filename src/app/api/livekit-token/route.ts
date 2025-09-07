import { NextRequest, NextResponse } from "next/server";
import { createLiveKitToken } from "@/app/api/livekit-token/livekit-token";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get("room");
  const user = searchParams.get("user");

  if (!room || !user) {
    console.error("[LiveKit Token API] Missing required parameters");
    return NextResponse.json(
      { error: "Missing room or user parameter" },
      { status: 400 }
    );
  }

  try {
    const token = await createLiveKitToken({ 
      roomName: room, 
      userName: user 
    });
    
    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate token", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}