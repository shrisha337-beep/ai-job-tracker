"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Bot, User, Sparkles, AlertCircle, Terminal } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string;
  metadata?: string;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onActionTriggered?: (action: any) => void;
}

export default function ChatSidebar({ isOpen, onClose, onActionTriggered }: ChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Quick Action Chips
  const quickActions = [
    { label: "📋 Show pipeline", text: "Show my pipeline" },
    { label: "💡 Help guide", text: "Help me" },
    { label: "⚙️ Move Stripe", text: "Move Stripe to Interview" },
  ];

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch chat history
  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle click outside to close (optional but helpful)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest("#chat-toggle-btn")
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const fetchMessages = async () => {
    try {
      setError(null);
      const res = await fetch("/api/chat");
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err: any) {
      console.error(err);
      setError("Unable to load chat history.");
    }
  };

  const handleSend = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText) return;

    if (!textToSend) setInput("");
    setError(null);
    setIsLoading(true);

    // Optimistically append user message
    const tempUserMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "USER",
      content: messageText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const data = await res.json();
      
      // Append assistant message
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }

      // Check if bot performed any database update action
      if (data.action && onActionTriggered) {
        onActionTriggered(data.action);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={sidebarRef}
      className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-[var(--bg-secondary)]/90 backdrop-blur-xl border-l border-[var(--border-primary)] shadow-2xl flex flex-col transition-all duration-300 transform ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-glow-primary">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
              JobTracker Assistant
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h3>
            <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
              <Terminal size={10} /> Local Dev Sandbox Mode
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--color-primary)]">
              <Sparkles size={24} className="animate-pulse" />
            </div>
            <div>
              <p className="font-medium text-sm text-[var(--text-primary)]">Start your AI Chat Automation</p>
              <p className="text-xs text-[var(--text-muted)] max-w-[280px] mt-1">
                Ask me to move application statuses, check your pipeline, or optimize your active resume.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isAssistant = msg.role === "ASSISTANT";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-semibold ${
                  isAssistant
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-primary)]"
                }`}
              >
                {isAssistant ? <Bot size={14} /> : <User size={14} />}
              </div>

              {/* Bubble */}
              <div
                className={`p-3 rounded-2xl text-sm leading-relaxed border ${
                  isAssistant
                    ? "bg-[var(--bg-tertiary)]/50 border-[var(--border-primary)] text-[var(--text-primary)]"
                    : "bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20 text-[var(--color-primary-light)]"
                }`}
              >
                <div className="prose prose-invert max-w-none text-xs sm:text-sm space-y-1">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-1">{children}</ol>,
                      li: ({ children }) => <li className="text-[var(--text-secondary)]">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 mr-auto max-w-[85%] animate-pulse">
            <div className="w-7 h-7 rounded-lg shrink-0 bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Bot size={14} className="text-indigo-400" />
            </div>
            <div className="p-3 bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] rounded-2xl flex items-center space-x-1.5 h-9">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex gap-2 items-center justify-center p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs mt-2">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions Footer */}
      {messages.length < 5 && (
        <div className="px-5 py-2 flex flex-wrap gap-1.5 border-t border-[var(--border-primary)]/50 bg-[var(--bg-secondary)]/40">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(action.text)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)] transition-all duration-200"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-4 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask something... (e.g. 'help')"
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-[var(--color-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all duration-200"
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          className="p-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:bg-[var(--bg-tertiary)] text-white disabled:text-[var(--text-muted)] border border-transparent disabled:border-[var(--border-primary)] transition-all duration-200 flex items-center justify-center shadow-glow-primary"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
