import { streamText, stepCountIs } from "ai";
import { z } from "zod";
import { google } from "@/lib/ai/provider";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { tools } from "@/lib/ai/tools";
import { checkRateLimit } from "@/lib/rate-limiter";
import { headers } from "next/headers";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(2000),
});

const chatRequestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
});

function getClientIp(headerStore: Headers): string {
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "anonymous"
  );
}

function getAllowedOrigin(headerStore: Headers): string {
  const origin = headerStore.get("origin") ?? "";
  const host = headerStore.get("host") ?? "";
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  const selfOrigin = `${protocol}://${host}`;
  return origin === selfOrigin ? origin : selfOrigin;
}

function corsHeaders(allowedOrigin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function rateLimitHeaders(
  remaining: number,
  resetAt: number,
): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
  };
}

export async function OPTIONS() {
  const headerStore = await headers();
  const allowedOrigin = getAllowedOrigin(headerStore);
  return new Response(null, {
    status: 204,
    headers: corsHeaders(allowedOrigin),
  });
}

export async function POST(req: Request) {
  const headerStore = await headers();
  const clientIp = getClientIp(headerStore);
  const allowedOrigin = getAllowedOrigin(headerStore);
  const rateLimit = checkRateLimit(clientIp);

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(
            Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
          ),
          ...corsHeaders(allowedOrigin),
          ...rateLimitHeaders(rateLimit.remaining, rateLimit.resetAt),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(allowedOrigin),
      },
    });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(allowedOrigin),
      },
    });
  }

  const result = streamText({
    model: google("gemini-3.1-flash-lite-preview"),
    system: SYSTEM_PROMPT,
    messages: parsed.data.messages,
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse({
    headers: {
      ...corsHeaders(allowedOrigin),
      ...rateLimitHeaders(rateLimit.remaining, rateLimit.resetAt),
    },
  });
}
