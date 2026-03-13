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


