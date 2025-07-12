import { SFUConfig } from "./types";

export const SFU_CONFIG: SFUConfig = {
  host: "https://global.sfu.metered.ca",
  appId: "6870d1822bdfeac2df5ac9de",
  secret: "c2OgFr1wqNT/5Dv7",
};

export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.metered.ca:80" },
];
