/**
 * LabAIAssistant — bilingual (Bangla-English) floating chat assistant.
 * Aware of the active experiment, current step, and mistakes.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { Bot, Loader2, MessageCircle, Send, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { chatWithAssistant } from "@/lib/chat.functions";
import type { AIContext, ChatMessage } from "@/components/lab/types";

interface Props {
  context: AIContext;
}

const STORAGE_KEY = "lab:chat:history";
const MAX_PERSIST = 30;

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function LabAIAssistant({ context }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const callChat = useServerFn(chatWithAssistant);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages.slice(-MAX_PERSIST)),
      );
    } catch {
      /* ignore */
    }
  }, [messages]);

  // Auto-scroll on new message or while loading
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    try {
      const res = await callChat({
        data: {
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          context,
        },
      });
      const reply: ChatMessage = {
        id: uid(),
        role: "assistant",
        content:
          res.error || !res.reply
            ? `⚠️ ${res.error || "কোনো উত্তর পাওয়া যায়নি।"}`
            : res.reply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: "⚠️ Network error. আবার চেষ্টা করুন।",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, context, callChat]);

  const clearChat = useCallback(() => {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const suggestions = useMemo(() => {
    if (context.experimentId === "oxygen_prep")
      return [
        "MnO₂ এর ভূমিকা কী?",
        "Glowing splint test কেন করি?",
      ];
    if (context.experimentId === "co2_prep")
      return [
        "Limewater কেন ঘোলা হয়?",
        "CO₂ upward displacement এ কেন collect করি?",
      ];
    if (context.experimentId === "nacl_crystal")
      return [
        "ফিল্টার না করলে কী হবে?",
        "সম্পৃক্ত দ্রবণ কেন দরকার?",
        "বীজ কেলাস কেন যোগ করি?",
      ];
    if (context.experimentId === "titration")
      return [
        "Equivalence point আর endpoint এর পার্থক্য?",
        "Phenolphthalein কেন use করি?",
      ];
    if (context.experimentId === "ionic_covalent")
      return [
        "আয়নিক ও সমযোজী যৌগের মৌলিক পার্থক্য?",
        "কঠিন NaCl কেন তড়িৎ পরিবহন করে না?",
        "CuSO₄ এর electrolysis-এ ক্যাথোডে কী জমা হয়?",
      ];
    if (context.experimentId === "na2co3_standard")
      return [
        "Na₂CO₃ কেন primary standard substance?",
        "Lower meniscus কেন পড়তে হয়?",
        "Warm water ব্যবহার করলে কী সমস্যা হবে?",
      ];
    return ["এই experiment-এর উদ্দেশ্য কী?", "পরের ধাপ কী?"];
  }, [context.experimentId]);

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-2xl ring-2 ring-primary/30 transition hover:scale-105 hover:shadow-primary/40"
          aria-label="Open AI Assistant"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium">AI সহকারী</span>
        </button>
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-0 right-0 z-50 flex w-full flex-col border-l bg-background shadow-2xl transition-all duration-300 sm:right-5 sm:bottom-5 sm:w-[400px] sm:rounded-2xl sm:border",
          open
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-6 opacity-0 pointer-events-none",
        )}
        style={{ height: "min(620px, 85vh)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-gradient-to-r from-primary/10 to-transparent px-3 py-2 sm:rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/15 p-1.5">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">
                Chemistry সহকারী
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Bilingual · context-aware
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={clearChat}
                title="Clear chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="space-y-3 p-3">
            {messages.length === 0 && (
              <div className="space-y-3 py-6 text-center">
                <Bot className="mx-auto h-8 w-8 text-primary/60" />
                <p className="text-sm text-muted-foreground">
                  জিজ্ঞেস করুন কিছু — concept, equation বা experiment-এর যেকোনো ধাপ।
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 px-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="rounded-full border bg-muted/40 px-2.5 py-1 text-xs hover:bg-muted"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex animate-in fade-in slide-in-from-bottom-1 duration-200",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm",
                  )}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none break-words dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  AI ভাবছে...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 border-t p-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="প্রশ্ন লিখুন..."
            disabled={loading}
            className="flex-1"
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </>
  );
}
