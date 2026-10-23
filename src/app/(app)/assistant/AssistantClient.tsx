"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { AssistantCardRenderer, CardPayload } from "@/components/assistant/AssistantCards";

export interface ChatUIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards?: CardPayload[];
  isStreaming?: boolean;
}

interface AssistantClientProps {
  initialSessionId?: string;
  initialMessages?: ChatUIMessage[];
  userName?: string;
}

const SUGGESTED_PROMPTS = [
  "Analyze my resume and tell me my match score.",
  "Find top matching internships for software roles.",
  "Create an adaptive 14-day study plan with 2 hours per day.",
  "Give me my next DSA challenge based on my weakest topic.",
];

export function AssistantClient({
  initialSessionId,
  initialMessages = [],
  userName = "there",
}: AssistantClientProps) {
  const [messages, setMessages] = useState<ChatUIMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTool]);

  const handleSubmit = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || isStreaming) return;

    setInput("");

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `asst-${Date.now()}`;

    // Append user message and empty streaming assistant bubble
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", content: messageText },
      { id: assistantMessageId, role: "assistant", content: "", cards: [], isStreaming: true },
    ]);

    setIsStreaming(true);
    setActiveTool(null);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, sessionId }),
      });

      if (!response.ok || !response.body) {
        const errText = await response.text();
        throw new Error(errText || "Failed to connect to assistant stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          if (!block.trim()) continue;

          let eventType = "message";
          let dataStr = "";

          for (const line of block.split("\n")) {
            if (line.startsWith("event:")) {
              eventType = line.replace("event:", "").trim();
            } else if (line.startsWith("data:")) {
              dataStr = line.replace("data:", "").trim();
            }
          }

          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);

            if (eventType === "tool_call") {
              setActiveTool(`Running ${data.name}...`);
            } else if (eventType === "tool_result") {
              setActiveTool(null);
              if (data.card) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, cards: [...(m.cards || []), data.card] }
                      : m
                  )
                );
              }
            } else if (eventType === "delta") {
              setActiveTool(null);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: (m.content || "") + (data.text || "") }
                    : m
                )
              );
            } else if (eventType === "done") {
              if (data.sessionId) {
                setSessionId(data.sessionId);
              }
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId ? { ...m, isStreaming: false } : m
                )
              );
            } else if (eventType === "error") {
              setActiveTool(null);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content:
                          (m.content ? m.content + "\n\n" : "") +
                          `Notice: ${data.message || "An error occurred."}`,
                        isStreaming: false,
                      }
                    : m
                )
              );
            }
          } catch {
            // Ignore parse errors on individual SSE frames
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content:
                  (m.content ? m.content + "\n\n" : "") +
                  `Notice: Service communication error. Please try again.`,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      setActiveTool(null);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId ? { ...m, isStreaming: false } : m
        )
      );
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col bg-[var(--color-background)]">
      {/* Top Header */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-1)] px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[var(--color-primary-muted)] text-[var(--color-primary)]">
            <Bot size={18} />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-[var(--color-foreground)]">
              Campus Career Copilot Assistant
            </h1>
            <p className="text-[11px] text-[var(--color-muted-foreground)]">
              Grounded in live placement data, active resume scores, and Leitner mastery
            </p>
          </div>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 ? (
            <div className="my-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-primary)]">
                <Sparkles size={24} />
              </div>
              <h2 className="mt-4 text-base font-semibold text-[var(--color-foreground)]">
                Welcome, {userName}!
              </h2>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)] max-w-md mx-auto">
                Ask me to analyze your resume fit, rank target internships, build an adaptive study plan, or evaluate your DSA answers.
              </p>

              {/* Prompt Suggestions */}
              <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-left">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSubmit(prompt)}
                    className="flex items-center justify-between rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-1)] p-3 text-xs text-[var(--color-foreground)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-2)]"
                  >
                    <span>{prompt}</span>
                    <ArrowRight size={14} className="shrink-0 text-[var(--color-muted-foreground)]" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] bg-[var(--color-primary-muted)] text-[var(--color-primary)] mt-0.5">
                    <Bot size={14} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-[6px] p-3.5 ${
                    m.role === "user"
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-xs"
                      : "border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-foreground)] shadow-xs"
                  }`}
                >
                  {/* Text content with preserved linebreaks */}
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {m.content}
                  </div>

                  {/* Render Structured Cards if present */}
                  {m.cards && m.cards.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.cards.map((card, idx) => (
                        <AssistantCardRenderer key={idx} card={card} />
                      ))}
                    </div>
                  )}

                  {/* Streaming indicator */}
                  {m.isStreaming && !m.content && (
                    <div className="flex items-center gap-2 py-1 text-[var(--color-muted-foreground)]">
                      <Loader2 size={13} className="animate-spin text-[var(--color-primary)]" />
                      <span>{activeTool || "Thinking..."}</span>
                    </div>
                  )}
                </div>

                {m.role === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)] mt-0.5">
                    <User size={14} />
                  </div>
                )}
              </div>
            ))
          )}

          {activeTool && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] pl-10">
              <Loader2 size={12} className="animate-spin text-[var(--color-primary)]" />
              <span>{activeTool}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-1)] px-4 py-3 md:px-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="mx-auto flex max-w-3xl items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about resume fit, internships, study plan, or DSA practice..."
            disabled={isStreaming}
            className="flex-1 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-primary)] focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {isStreaming ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
