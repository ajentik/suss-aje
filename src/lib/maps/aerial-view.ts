const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export interface AerialVideo {
  uris: Record<string, string>;
  state: "ACTIVE" | "PROCESSING" | "NEEDS_PROCESSING";
  metadata?: {
    videoId: string;
    captureDate?: { year: number; month: number; day: number };
    duration?: string;
  };
}

export async function lookupAerialVideo(
  address: string
): Promise<AerialVideo | null> {
  try {
    const res = await fetch(
      `https://aerialview.googleapis.com/v1/videos:lookupVideo?key=${API_KEY}&address=${encodeURIComponent(address)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.state === "ACTIVE") return data;
    return null;
  } catch {
    return null;
  }
}

export async function renderAerialVideo(
  address: string
): Promise<string | null> {
  try {
    // First try lookup
    const existing = await lookupAerialVideo(address);
    if (existing?.uris) {
      return existing.uris["VIDEO_MP4_HIGH"] || existing.uris["VIDEO_MP4_MEDIUM"] || Object.values(existing.uris)[0] || null;
    }

    // Request render if not available
    const res = await fetch(
      `https://aerialview.googleapis.com/v1/videos:renderVideo?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      }
    );
    if (!res.ok) return null;

    // Video is being rendered, won't be available immediately
    return null;
  } catch {
    return null;
  }
}

export function getAerialVideoUrl(address: string): string {
  return `https://aerialview.googleapis.com/v1/videos:lookupVideo?key=${API_KEY}&address=${encodeURIComponent(address)}`;
}
