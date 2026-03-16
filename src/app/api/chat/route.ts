import { convertToModelMessages, streamText, stepCountIs, UIMessage } from "ai";
import { google } from "@/lib/ai/provider";
import { getSystemPrompt } from "@/lib/ai/system-prompt";
import { tools } from "@/lib/ai/tools";
import type { LanguageCode } from "@/types";

export const maxDuration = 30;

const VALID_LANGUAGES = new Set<LanguageCode>(["en", "zh", "ms", "ta"]);

export async function POST(req: Request) {
  let body: { messages: UIMessage[]; preferredLanguage?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
    });
  }

  const lang: LanguageCode =
    body.preferredLanguage && VALID_LANGUAGES.has(body.preferredLanguage as LanguageCode)
      ? (body.preferredLanguage as LanguageCode)
      : "en";

  const result = streamText({
    model: google("gemini-3.1-flash-lite-preview"),
    system: getSystemPrompt(lang),
    messages: await convertToModelMessages(body.messages),
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
