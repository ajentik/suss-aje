"use client";

import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  timestamp?: Date;
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
        h1: ({ children }) => (
          <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold mb-1.5 mt-2.5 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-[0.9375rem] font-semibold mb-1 mt-2 first:mt-0">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h4>
        ),
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        ul: ({ children }) => (
          <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>
        ),
        li: ({ children }) => <li className="pl-0.5">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-bold">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:text-accent transition-colors"
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-3 border-primary/30 pl-3 my-2 text-muted-foreground italic">
            {children}
          </blockquote>
        ),
        hr: () => (
          <hr className="my-3 border-t border-foreground/10" />
        ),
        del: ({ children }) => (
          <del className="line-through opacity-60">{children}</del>
        ),
        table: ({ children }) => (
          <div className="my-2 overflow-x-auto rounded-lg border border-foreground/10">
            <table className="w-full text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-foreground/5 text-left">{children}</thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr className="border-b border-foreground/5 last:border-0">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-3 py-1.5 font-semibold text-xs uppercase tracking-wide">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-1.5">{children}</td>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          return isBlock ? (
            <code
              className={cn(
                "block bg-foreground/5 rounded-lg p-3 text-xs overflow-x-auto my-2 font-mono leading-relaxed",
                className
              )}
            >
              {children}
            </code>
          ) : (
            <code className="bg-foreground/10 rounded px-1.5 py-0.5 text-[0.8em] font-mono">
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
  timestamp,
}: ChatMessageProps) {
  const [showTime, setShowTime] = useState(false);

  return (
    <article
      className={cn(
        "flex w-full mb-3 animate-chat-slide-up",
        role === "user" ? "justify-end" : "justify-start"
      )}
      aria-label={`${role === "user" ? "You" : "AskSUSSi"} said`}
    >
      <div className={cn(
        "flex flex-col",
        role === "user" ? "max-w-[82%]" : "max-w-[88%]"
      )}>
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!isStreaming) { setShowTime((s) => !s); } } }}
          onClick={() => !isStreaming && setShowTime((s) => !s)}
          className={cn(
            "px-4 py-2.5 text-base leading-relaxed",
            "transition-all duration-200",
            role === "user"
              ? [
                  "bg-surface-brand text-surface-brand-foreground",
                  "rounded-[20px] rounded-br-[6px]",
                  "shadow-[0_1px_3px_oklch(0_0_0/0.08)]",
                ]
              : [
                  "bg-secondary text-foreground",
                  "rounded-[20px] rounded-bl-[6px]",
                ]
          )}
        >
          {role === "assistant" ? (
            <>
              <MemoizedMarkdown content={content} />
              {isStreaming && (
                <span className="inline-block w-[2px] h-[1em] ml-0.5 -mb-[2px] bg-primary/60 rounded-full animate-pulse" />
              )}
            </>
          ) : (
            content
          )}
        </div>
        {showTime && timestamp && (
          <span
            className={cn(
              "text-[0.625rem] text-muted-foreground mt-1 animate-chat-fade-in",
              role === "user" ? "self-end mr-2" : "self-start ml-2"
            )}
          >
            {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </article>
  );
}
