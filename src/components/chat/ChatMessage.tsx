"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const MemoizedMarkdown = memo(function MemoizedMarkdown({
  content,
}: {
  content: string;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="list-disc pl-4 mb-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-4 mb-2">{children}</ol>
        ),
        li: ({ children }) => <li className="mb-0.5">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-accent"
          >
            {children}
          </a>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          return isBlock ? (
            <code
              className={cn(
                "block bg-black/5 rounded p-2 text-xs overflow-x-auto my-2 font-mono",
                className
              )}
            >
              {children}
            </code>
          ) : (
            <code className="bg-black/10 rounded px-1 py-0.5 text-xs font-mono">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <pre className="my-1">{children}</pre>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
});

export default function ChatMessage({
  role,
  content,
  isStreaming,
}: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex w-full mb-3",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-[0.9375rem] leading-relaxed",
          role === "user"
            ? "bg-surface-brand text-surface-brand-foreground rounded-br-sm"
            : "bg-secondary text-foreground rounded-bl-sm"
        )}
      >
        {role === "assistant" ? (
          <>
            <MemoizedMarkdown content={content} />
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 -mb-0.5 bg-current animate-pulse rounded-sm" />
            )}
          </>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
