import { convertToModelMessages, streamText, stepCountIs, UIMessage } from "ai";
import { google } from "@/lib/ai/provider";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { tools } from "@/lib/ai/tools";

export const maxDuration = 30;

export async function POST(req: Request) {
  let body: { messages: UIMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
    });
  }

  const result = streamText({
    model: google("gemini-3.1-flash-lite-preview"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(body.messages),
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
