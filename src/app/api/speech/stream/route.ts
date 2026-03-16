import { SpeechClient } from "@google-cloud/speech";
import type { google } from "@google-cloud/speech/build/protos/protos";

export const maxDuration = 60;

const ADAPTATION_PHRASES: google.cloud.speech.v2.PhraseSet.IPhrase[] = [
  { value: "SUSS", boost: 20 },
  { value: "AskSUSSi", boost: 20 },
  { value: "Clementi", boost: 10 },
  { value: "hawker centre", boost: 10 },
  { value: "kopitiam", boost: 10 },
  { value: "MRT", boost: 10 },
  { value: "NUS", boost: 5 },
  { value: "SIM", boost: 10 },
  { value: "block A", boost: 5 },
  { value: "block B", boost: 5 },
  { value: "block C", boost: 5 },
  { value: "block D", boost: 5 },
  { value: "campus", boost: 5 },
  { value: "library", boost: 5 },
  { value: "canteen", boost: 5 },
  { value: "lecture hall", boost: 5 },
  { value: "sports complex", boost: 5 },
];

const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT ?? "";
const SPEECH_REGION = process.env.SPEECH_REGION ?? "asia-southeast1";

function createSpeechClient(): SpeechClient {
  return new SpeechClient({
    apiEndpoint: `${SPEECH_REGION}-speech.googleapis.com`,
  });
}

export async function POST(req: Request): Promise<Response> {
  if (!GOOGLE_CLOUD_PROJECT) {
    return new Response(
      JSON.stringify({ error: "GOOGLE_CLOUD_PROJECT not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const audioBody = await req.arrayBuffer();
  if (audioBody.byteLength === 0) {
    return new Response(
      JSON.stringify({ error: "Empty audio body" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const audioBuffer = Buffer.from(audioBody);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function sendSSE(event: string, data: Record<string, unknown>) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      }

      let client: SpeechClient | null = null;

      try {
        client = createSpeechClient();
        const recognizeStream = client._streamingRecognize();

        recognizeStream.write({
          recognizer: `projects/${GOOGLE_CLOUD_PROJECT}/locations/${SPEECH_REGION}/recognizers/_`,
          streamingConfig: {
            config: {
              autoDecodingConfig: {},
              languageCodes: ["en-SG"],
              model: "chirp_2",
              adaptation: {
                phraseSets: [
                  {
                    inlinePhraseSet: {
                      phrases: ADAPTATION_PHRASES,
                    },
                  },
                ],
              },
            },
            streamingFeatures: {
              interimResults: true,
              enableVoiceActivityEvents: true,
            },
          },
        });

        const CHUNK_SIZE = 25_000;
        for (let offset = 0; offset < audioBuffer.length; offset += CHUNK_SIZE) {
          const chunk = audioBuffer.subarray(offset, offset + CHUNK_SIZE);
          recognizeStream.write({ audio: chunk });
        }

        recognizeStream.end();

        for await (const response of recognizeStream) {
          const typedResponse =
            response as google.cloud.speech.v2.IStreamingRecognizeResponse;

          if (typedResponse.results) {
            for (const result of typedResponse.results) {
              const alternative = result.alternatives?.[0];
              if (alternative) {
                sendSSE("transcript", {
                  transcript: alternative.transcript ?? "",
                  isFinal: result.isFinal ?? false,
                  stability: result.stability ?? 0,
                });
              }
            }
          }
        }

        sendSSE("done", {});
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Speech recognition failed";
        sendSSE("error", { error: message });
      } finally {
        controller.close();
        if (client) {
          await client.close();
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
