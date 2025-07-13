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
  console.log("[Token Creation] Starting token generation for:", { roomName, userName });
  
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error("Missing LiveKit credentials in environment variables");
  }

  try {
    // Create AccessToken with TTL (time-to-live) - expires in 6 hours
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userName,
      ttl: "6h", // Token expires in 6 hours (can be "1h", "24h", or seconds as number)
    });

    // Add explicit VideoGrant with all required permissions
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,      // Allow publishing audio/video tracks
      canSubscribe: true,    // Allow subscribing to other tracks  
      canPublishData: true,  // Allow publishing data messages
    });

    // Generate JWT token (async in SDK v2)
    const token = await at.toJwt();
    
    console.log("[Token Creation] Token generated successfully");
    console.log("[Token Creation] Token preview:", token.substring(0, 50) + "...");
    
    return token;
  } catch (error) {
    console.error("[Token Creation] Failed to generate token:", error);
    throw new Error("Failed to generate LiveKit token");
  }
}