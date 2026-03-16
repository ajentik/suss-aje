import { NextResponse } from "next/server";
import { v2 } from "@google-cloud/speech";

let singlishPhrases: string[] = [];
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("@/data/singlishAdaptation");
  if (Array.isArray(mod.singlishPhrases)) {
    singlishPhrases = mod.singlishPhrases;
  } else if (Array.isArray(mod.default)) {
    singlishPhrases = mod.default;
  }
} catch {
  // singlishAdaptation module not yet created — phrase biasing disabled
}

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

function getCredentials(): {
  credentials: { client_email: string; private_key: string };
  projectId: string;
} | null {
  const raw = process.env.GOOGLE_CLOUD_STT_CREDENTIALS;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      client_email?: string;
      private_key?: string;
      project_id?: string;
    };
    if (!parsed.client_email || !parsed.private_key || !parsed.project_id) {
      return null;
    }
    return {
      credentials: {
        client_email: parsed.client_email,
        private_key: parsed.private_key,
      },
      projectId: parsed.project_id,
    };
  } catch {
    return null;
  }
}

let _client: v2.SpeechClient | null = null;
let _projectId: string | null = null;

function getSpeechClient(): v2.SpeechClient | null {
  if (_client) return _client;

  const creds = getCredentials();
  if (creds) {
    _client = new v2.SpeechClient({
      credentials: creds.credentials,
      projectId: creds.projectId,
    });
    _projectId = creds.projectId;
    return _client;
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    _client = new v2.SpeechClient();
    _projectId = null;
    return _client;
  }

  return null;
}

function getProjectId(): string {
  if (_projectId) return _projectId;
  const creds = getCredentials();
  return creds?.projectId ?? "";
}

interface SpeechRequestBody {
  audio: string;
  encoding?: string;
  sampleRateHertz?: number;
  languageCode?: string;
}

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { rateLimit } = require("@/lib/rate-limiter");
    if (typeof rateLimit === "function") {
      const limited = await rateLimit(req);
      if (limited) {
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429 },
        );
      }
    }
  } catch {
    // rate-limiter not available
  }

  const client = getSpeechClient();
  if (!client) {
    return NextResponse.json(
      {
        error:
          "Google Cloud STT credentials are not configured. " +
          "Set GOOGLE_CLOUD_STT_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS.",
      },
      { status: 500 },
    );
  }

  let body: SpeechRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.audio || typeof body.audio !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'audio' field (expected base64 string)" },
      { status: 400 },
    );
  }

  if (body.audio.length > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: `Audio payload exceeds ${MAX_AUDIO_BYTES} byte limit` },
      { status: 413 },
    );
  }

  const projectId = getProjectId();
  const recognizer = projectId
    ? `projects/${projectId}/locations/global/recognizers/_`
    : "";

  const languageCodes = [body.languageCode ?? "en-SG", "en-US", "zh"];
  const uniqueLanguageCodes = [...new Set(languageCodes)];

  const recognizeRequest: Parameters<typeof client.recognize>[0] = {
    recognizer,
    config: {
      languageCodes: uniqueLanguageCodes,
      model: "chirp_2",
      features: {
        enableAutomaticPunctuation: true,
        enableSpokenPunctuation: false,
      },
      adaptation:
        singlishPhrases.length > 0
          ? {
              phraseSets: [
                {
                  inlinePhraseSet: {
                    phrases: singlishPhrases.map((phrase) => ({
                      value: phrase,
                    })),
                  },
                },
              ],
            }
          : undefined,
    },
    content: Buffer.from(body.audio, "base64"),
  };

  try {
    const [response] = await client.recognize(recognizeRequest);

    const results = response.results ?? [];
    const topResult = results[0];
    const topAlt = topResult?.alternatives?.[0];

    return NextResponse.json({
      transcript: topAlt?.transcript ?? "",
      confidence: topAlt?.confidence ?? 0,
      languageCode: topResult?.languageCode ?? body.languageCode ?? "en-SG",
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Speech recognition failed";
    const statusCode =
      typeof (err as { code?: number }).code === "number"
        ? mapGrpcStatus((err as { code: number }).code)
        : 500;

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

// gRPC status codes are opaque numeric constants — comments explain each
function mapGrpcStatus(code: number): number {
  const grpcToHttp: Record<number, number> = {
    3: 400,  // INVALID_ARGUMENT
    5: 404,  // NOT_FOUND
    7: 403,  // PERMISSION_DENIED
    8: 429,  // RESOURCE_EXHAUSTED
    14: 503, // UNAVAILABLE
  };
  return grpcToHttp[code] ?? 500;
}
