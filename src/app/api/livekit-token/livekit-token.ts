import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;

export async function createLiveKitToken({
  roomName,
  userName,
}: {
  roomName: string;
  userName: string;
}) {
  
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error("Missing LiveKit credentials in environment variables");
  }

  try {
    // Create AccessToken with TTL (time-to-live): expires in 6 hrs, can be adjusted)
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userName,
      ttl: "6h",
    });

    // Add explicit VideoGrant with all permissions
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // Generate JWT token
    const token = await at.toJwt();
    
    return token;
  } catch (error) {
    console.error("[Token Creation] Failed to generate token:", error);
    throw new Error("Failed to generate LiveKit token");
  }
}