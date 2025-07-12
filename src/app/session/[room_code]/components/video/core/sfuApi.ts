import {
  SFUConfig,
  SFUApiResponse,
  PublishTrackRequest,
  SubscribeTrackRequest,
  RenegotiateRequest,
  Track,
} from "./types";

export class SFUApiClient {
  private config: SFUConfig;

  constructor(config: SFUConfig) {
    this.config = config;
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.secret}`,
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.host}/api/sfu/${this.config.appId}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `SFU API request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async createSession(
    offer: RTCSessionDescriptionInit
  ): Promise<SFUApiResponse> {
    return this.makeRequest<SFUApiResponse>("/session/new", {
      method: "POST",
      body: JSON.stringify({ sessionDescription: offer }),
    });
  }

  async publishTracks(
    sessionId: string,
    request: PublishTrackRequest
  ): Promise<SFUApiResponse> {
    return this.makeRequest<SFUApiResponse>(
      `/session/${sessionId}/track/publish`,
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
  }

  async subscribeToTracks(
    sessionId: string,
    request: SubscribeTrackRequest
  ): Promise<SFUApiResponse> {
    return this.makeRequest<SFUApiResponse>(
      `/session/${sessionId}/track/subscribe`,
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
  }

  async renegotiateSession(
    sessionId: string,
    request: RenegotiateRequest
  ): Promise<void> {
    await this.makeRequest(`/session/${sessionId}/renegotiate`, {
      method: "PUT",
      body: JSON.stringify(request),
    });
  }

  async getSessions(): Promise<{ sessionId: string }[]> {
    return this.makeRequest<{ sessionId: string }[]>("/sessions", {
      method: "GET",
    });
  }

  async getSessionTracks(sessionId: string): Promise<Track[]> {
    return this.makeRequest<Track[]>(`/session/${sessionId}/tracks`, {
      method: "GET",
    });
  }
}
