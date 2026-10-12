/**
 * Renders a single chat message with Markdown + KaTeX support.
 * Chemistry equations like $CaCO_3 + 2HCl \to CaCl_2 + H_2O + CO_2$ render natively.
 */
import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Bot, Copy, User } from "lucide-react";
import { toast } from "sonner";
import "katex/dist/katex.min.css";

import { cn } from "@/lib/utils";
import type { TutorMessage } from "@/lib/tutor-store";
import { Button } from "@/components/ui/button";

interface Props {
  message: TutorMessage;
}

function MessageBubbleImpl({ message }: Props) {
  const isUser = message.role === "user";

  const copy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success("Copied");
  };

  return (
    <div
      className={cn("group flex w-full gap-3 px-4 py-5", isUser ? "bg-transparent" : "bg-muted/30")}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            {isUser ? "আপনি" : "Dr. Chem"}
          </span>
          {!isUser && message.content && !message.streaming && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 transition group-hover:opacity-100"
              onClick={copy}
              aria-label="Copy"
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
        </div>
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none break-words dark:prose-invert prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-pre:my-2">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {message.content || (message.streaming ? "…" : "")}
            </ReactMarkdown>
            {message.streaming && (
              <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-primary align-middle" />
            )}
          </div>
        )}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.sources.map((s, i) => (
              <span
                key={i}
                className="rounded-full border bg-background px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                📖 {s.source || "Book"}
                {s.page ? ` · p.${s.page}` : ""}
                {s.chapter ? ` · ${s.chapter}` : ""}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(MessageBubbleImpl);
