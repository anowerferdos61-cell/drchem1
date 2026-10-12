/**
 * Auto-growing composer with Send / Stop button.
 * Enter sends, Shift+Enter inserts newline.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  ragMode: boolean;
}

export default function Composer({ onSend, onStop, isStreaming, disabled, ragMode }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  // Seed prefill from Smart Notes "Ask Dr. Chem" deep link
  useEffect(() => {
    try {
      const seed = sessionStorage.getItem("tutor:seed");
      if (seed) {
        setValue(seed);
        sessionStorage.removeItem("tutor:seed");
        requestAnimationFrame(() => ref.current?.focus());
      }
    } catch {
      /* ignore */
    }
  }, []);

  const submit = () => {
    const v = value.trim();
    if (!v || isStreaming) return;
    onSend(v);
    setValue("");
    requestAnimationFrame(() => ref.current?.focus());
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t bg-background/95 backdrop-blur">
      <div className="mx-auto w-full max-w-3xl px-4 py-3">
        <div
          className={cn(
            "relative flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm transition focus-within:ring-2 focus-within:ring-primary/40",
            ragMode && "ring-1 ring-amber-400/60",
          )}
        >
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            placeholder={ragMode ? "📚 বই থেকে প্রশ্ন করুন…" : "যেকোনো রসায়ন প্রশ্ন লিখুন…"}
            rows={1}
            disabled={disabled}
            className="flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />
          {isStreaming ? (
            <Button
              size="icon"
              variant="destructive"
              className="h-9 w-9 shrink-0 rounded-xl"
              onClick={onStop}
              aria-label="Stop generating"
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl"
              onClick={submit}
              disabled={!value.trim() || disabled}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          Enter পাঠাতে · Shift+Enter নতুন লাইন · AI ভুল করতে পারে, যাচাই করুন।
        </p>
      </div>
    </div>
  );
}
