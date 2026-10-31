"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Loader2, X, BookOpen, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Explain this lesson in simpler terms",
  "Give me a worked example",
  "What did the instructor mean by that?",
  "Quiz me on this lesson",
];

/**
 * AI tutor chat.
 *
 * Calls the `ai-tutor-chat` Edge Function, which embeds the question, runs a
 * pgvector similarity search over `lesson_embeddings` for this course, and
 * streams a grounded answer with [Source N] citations.
 *
 * The response is a plain-text stream, so we read it with a ReadableStream
 * reader and append chunks as they arrive.
 */
export function AiTutorChat({
  courseId,
  courseTitle,
  lessonId,
  lessonTitle,
  onClose,
}: {
  courseId: string;
  courseTitle: string;
  lessonId?: string;
  lessonTitle?: string;
  onClose?: () => void;
}) {
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streaming]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || streaming) return;

    setError(null);
    setInput("");
    const history = messages.slice(-8);
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setStreaming(true);

    // Placeholder assistant message we stream into.
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error(
          "The AI tutor needs Supabase configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
        );
      }

      // Attach the user's session so the function can identify them.
      const { getSupabaseBrowserClient } = await import("@/lib/supabaseClient");
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(`${supabaseUrl}/functions/v1/ai-tutor-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${session?.access_token ?? anonKey}`,
        },
        body: JSON.stringify({ courseId, lessonId, message: question, history }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || `Tutor returned ${res.status}`);
      }

      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError((err as Error).message);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function reset() {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setStreaming(false);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border/70 px-4 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.8125rem] font-semibold leading-tight">AI Tutor</p>
          <p className="truncate text-[0.625rem] text-muted-foreground">
            Grounded in this course
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon-sm" onClick={reset} aria-label="New conversation">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
        {onClose && (
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close tutor">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col justify-center">
            <div className="rounded-xl border border-border/70 bg-secondary/30 p-4">
              <BookOpen className="h-4 w-4 text-primary" />
              <p className="mt-2 text-[0.8125rem] font-medium">
                Ask about anything in this course
              </p>
              <p className="mt-1 text-[0.6875rem] leading-relaxed text-muted-foreground">
                Answers come from the lesson material itself, with citations — not from
                the open internet.
              </p>
              {lessonTitle && (
                <p className="mt-2.5 rounded-md bg-background/70 px-2 py-1.5 text-[0.625rem] text-muted-foreground">
                  Currently on: {lessonTitle}
                </p>
              )}
            </div>

            <div className="mt-4 space-y-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full rounded-lg border border-border/70 px-3 py-2 text-left text-[0.75rem] text-foreground/75 transition-colors hover:border-primary/30 hover:bg-primary/[0.04] hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[0.75rem] leading-relaxed",
                      m.role === "user"
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md border border-border/70 bg-secondary/40 text-foreground/85",
                    )}
                  >
                    {m.content ? (
                      <div className="whitespace-pre-wrap break-words">{m.content}</div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Searching the course…
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-[0.6875rem] leading-relaxed text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border/70 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Ask about this lesson…"
            className="max-h-28 min-h-[38px] flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-[0.75rem] placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
          />
          <Button
            type="submit"
            size="icon"
            className="h-[38px] w-[38px] shrink-0"
            disabled={!input.trim() || streaming}
            aria-label="Send message"
          >
            {streaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </form>
        <p className="mt-1.5 text-center text-[0.5625rem] text-muted-foreground">
          Answers are generated from {courseTitle} lesson content.
        </p>
      </div>
    </div>
  );
}
