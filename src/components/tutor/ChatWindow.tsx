/**
 * Main chat window — scrolls, streams tokens, manages stop / send.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  appendMessage,
  appendToMessage,
  newConversation,
  renameConversation,
  updateMessage,
  useTutorState,
  type TutorConversation,
} from "@/lib/tutor-store";
import { generateTitle } from "@/lib/tutor-title.functions";
import MessageBubble from "./MessageBubble";
import Composer from "./Composer";
import { supabase } from "@/integrations/supabase/client";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Link } from "@tanstack/react-router";

const STREAM_URL = "/api/tutor/stream";

const SUGGESTIONS = [
  "Ionic bond আর covalent bond এর পার্থক্য?",
  "Periodic table এর group ও period মানে কী?",
  "CaCO₃ + HCl reaction-এর equation লিখো",
  "Acid-base titration কীভাবে কাজ করে?",
];

export default function ChatWindow() {
  const { conversations, activeId, ragMode } = useTutorState();
  const active: TutorConversation | null =
    conversations.find((c) => c.id === activeId) ?? null;

  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const callTitle = useServerFn(generateTitle);
  const { isPro, aiMessagesRemaining, refetch: refetchEnt } = useEntitlements();

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [active?.messages, streaming]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  const send = useCallback(
    async (text: string) => {
      // ensure a conversation exists
      let convo = active;
      if (!convo) convo = newConversation();
      const convoId = convo.id;

      appendMessage(convoId, { role: "user", content: text });
      const assistant = appendMessage(convoId, {
        role: "assistant",
        content: "",
        streaming: true,
      });

      // Auto title from first user message
      if (convo.messages.length === 0) {
        callTitle({ data: { message: text } })
          .then(({ title }) => {
            if (title) renameConversation(convoId, title);
          })
          .catch(() => {});
      }

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setStreaming(true);

      try {
        const history = [
          ...convo.messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: text },
        ];
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        const res = await fetch(STREAM_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ messages: history, ragMode }),
          signal: ctrl.signal,
        });

        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({ error: "Stream failed" }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let done = false;

        while (!done) {
          const { done: d, value } = await reader.read();
          if (d) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, nl);
            buf = buf.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line || line.startsWith(":")) continue;
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(data);
              // Sources sentinel sent by our /api/tutor/stream wrapper.
              if (parsed?.type === "sources" && Array.isArray(parsed.sources)) {
                updateMessage(convoId, assistant.id, {
                  sources: parsed.sources,
                });
                continue;
              }
              const delta = parsed.choices?.[0]?.delta?.content as
                | string
                | undefined;
              if (delta) appendToMessage(convoId, assistant.id, delta);
            } catch {
              buf = line + "\n" + buf;
              break;
            }
          }
        }
      } catch (e: unknown) {
        if ((e as Error).name === "AbortError") {
          appendToMessage(convoId, assistant.id, "\n\n_⏹ থামানো হয়েছে_");
        } else {
          const msg = (e as Error).message || "AI response failed";
          toast.error(msg);
          appendToMessage(convoId, assistant.id, `\n\n⚠️ ${msg}`);
        }
      } finally {
        updateMessage(convoId, assistant.id, { streaming: false });
        setStreaming(false);
        void refetchEnt();
        abortRef.current = null;
      }
    },
    [active, callTitle],
  );

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/15 p-1.5">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-none">
              {active?.title || "Dr. Chem — AI Chemistry Tutor"}
            </h1>

            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {ragMode ? "📚 বই থেকে উত্তর · Class 9-10" : "Chemistry Tutor · Class 9-10 · bilingual"}
            </p>
          </div>
        </div>
        {!isPro && (
          <div className="flex items-center gap-2 text-[10px]">
            <span className="rounded-full bg-amber-500/15 px-2 py-1 font-semibold text-amber-700 dark:text-amber-400">
              আজ বাকি: {Number.isFinite(aiMessagesRemaining) ? aiMessagesRemaining : "∞"} / 5
            </span>
            <Link to="/pricing" className="rounded-full bg-primary px-2 py-1 font-bold text-primary-foreground hover:opacity-90">
              Pro
            </Link>
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {!active || active.messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Dr. Chem-কে জিজ্ঞেস করুন</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Class 9-10 ও HSC chemistry concept, equation, experiment — সব
              ব্যাখ্যা পাবেন বাংলায়।
            </p>
            <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-xl border bg-card p-3 text-left text-xs transition hover:border-primary/40 hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl">
            {active.messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            <div className="h-4" />
          </div>
        )}
      </div>

      <Composer
        onSend={send}
        onStop={stop}
        isStreaming={streaming}
        ragMode={ragMode}
      />
    </div>
  );
}
