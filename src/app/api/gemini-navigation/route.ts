import { NextResponse } from "next/server";
import { generateText } from "ai";
import {
  google,
  type GoogleLanguageModelOptions,
  type GoogleGenerativeAIProviderMetadata,
} from "@ai-sdk/google";

export const maxDuration = 30;

const ELDERCARE_SYSTEM_PROMPT = `You are a navigation assistant for elderly patients and caregivers in Singapore. Understand Singlish queries. Prioritize accessibility: sheltered walkways, lifts over stairs, rest points. Mention nearby amenities. Give elderly-adjusted walking times (3 km/h). Understand medical facility names (polyclinic, SGH, TTSH, NUH, CGH, KTPH).`;

interface NavigationRequestBody {
  query: string;
  latitude: number;
  longitude: number;
}

interface GroundedPlace {
  placeId: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function extractPlaces(
  metadata: GoogleGenerativeAIProviderMetadata | undefined,
): GroundedPlace[] {
  const chunks = metadata?.groundingMetadata?.groundingChunks;
  if (!chunks) return [];

  const seen = new Set<string>();
  const places: GroundedPlace[] = [];

  for (const chunk of chunks) {
    if (!chunk.maps?.placeId) continue;
    if (seen.has(chunk.maps.placeId)) continue;
    seen.add(chunk.maps.placeId);

    places.push({
      placeId: chunk.maps.placeId,
      name: chunk.maps.title ?? "",
      address: chunk.maps.text ?? "",
      lat: null,
      lng: null,
    });
  }

  return places;
}

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured" },
      { status: 500 },
    );
  }

  let body: NavigationRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { query, latitude, longitude } = body;

  if (!query || typeof query !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'query' field" },
      { status: 400 },
    );
  }

  if (!isFiniteNumber(latitude) || !isFiniteNumber(longitude)) {
    return NextResponse.json(
      { error: "latitude and longitude must be finite numbers" },
      { status: 400 },
    );
  }

  try {
    const { text, providerMetadata } = await generateText({
      model: google("gemini-2.5-flash"),
      system: ELDERCARE_SYSTEM_PROMPT,
      tools: {
        google_maps: google.tools.googleMaps({}),
      },
      providerOptions: {
        google: {
          retrievalConfig: {
            latLng: { latitude, longitude },
          },
        } satisfies GoogleLanguageModelOptions,
      },
      prompt: query,
    });

    const metadata = providerMetadata?.google as
      | GoogleGenerativeAIProviderMetadata
      | undefined;

    const places = extractPlaces(metadata);

    const widgetContextToken =
      metadata?.groundingMetadata &&
      "googleMapsWidgetContextToken" in metadata.groundingMetadata
        ? (metadata.groundingMetadata as Record<string, unknown>)
            .googleMapsWidgetContextToken
        : undefined;

    return NextResponse.json({
      response: text,
      places,
      ...(typeof widgetContextToken === "string" && { widgetContextToken }),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Navigation request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
