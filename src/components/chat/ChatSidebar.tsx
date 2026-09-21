"use client";

import { useState, useRef, useEffect } from "react";
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Terminal,
  Sparkles,
  AlertCircle
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
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

  // Quick Action Chips (No Emojis)
  const quickActions = [
    { label: "Pipeline Status", text: "Show my pipeline" },
    { label: "Assistant Guide", text: "Help me" },
    { label: "Move Application", text: "Move Stripe to Interview" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest("#chat-toggle-btn") &&
        !(event.target as Element).closest("#chat-toggle-header-btn")
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to load chat history", err);
    }
  };

  const handleSend = async (manualText?: string) => {
    const textToSend = manualText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "USER",
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!manualText) setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });

      if (!res.ok) {
        throw new Error("Failed to process command.");
      }

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ASSISTANT",
        content: data.reply,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.action && onActionTriggered) {
        onActionTriggered(data.action);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={sidebarRef}
      className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-[#111114] border-l border-[#27272A] shadow-2xl flex flex-col transition-transform duration-200 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[#27272A] bg-[#09090B]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[2px] flex items-center justify-center bg-[#18181B] border border-[#27272A]">
            <Bot size={15} className="text-[#FAFAFA]" />
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#FAFAFA] flex items-center gap-1.5">
              Assistant
              <span className="w-1.5 h-1.5 rounded-[1px] bg-[#10B981]" />
            </h3>
            <p className="text-[10px] font-mono text-[#71717A] flex items-center gap-1">
              <Terminal size={10} /> Local Pipeline Parser
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-[2px] hover:bg-[#18181B] text-[#71717A] hover:text-[#FAFAFA] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-10 h-10 rounded-[2px] bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#FAFAFA]">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="font-bold uppercase text-xs text-[#FAFAFA]">Command Interface Ready</p>
              <p className="text-[11px] text-[#71717A] max-w-[280px] mt-1 leading-relaxed">
                Query pipeline records, move application statuses, or analyze qualification criteria.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isAssistant = msg.role === "ASSISTANT";
          return (
            <div
              key={msg.id}
              className={`flex gap-2 max-w-[90%] ${
                isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-[2px] shrink-0 flex items-center justify-center text-xs font-semibold ${
                  isAssistant
                    ? "bg-[#18181B] text-[#FAFAFA] border border-[#27272A]"
                    : "bg-[#27272A] text-[#FAFAFA]"
                }`}
              >
                {isAssistant ? <Bot size={12} /> : <User size={12} />}
              </div>

              <div
                className={`p-3 rounded-[2px] leading-relaxed border ${
                  isAssistant
                    ? "bg-[#18181B] border-[#27272A] text-[#FAFAFA]"
                    : "bg-[#27272A] border-[#3F3F46] text-[#FAFAFA]"
                }`}
              >
                <div className="prose prose-invert max-w-none text-xs space-y-1">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-1 last:mb-0 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5 my-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 space-y-0.5 my-1">{children}</ol>,
                      li: ({ children }) => <li className="text-[#A1A1AA]">{children}</li>,
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
          <div className="flex gap-2 mr-auto max-w-[85%]">
            <div className="w-6 h-6 rounded-[2px] shrink-0 bg-[#18181B] border border-[#27272A] flex items-center justify-center">
              <Bot size={12} className="text-[#A1A1AA]" />
            </div>
            <div className="p-2.5 bg-[#18181B] border border-[#27272A] rounded-[2px] flex items-center space-x-1.5">
              <span className="text-[10px] text-[#71717A] uppercase">Processing command...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex gap-2 items-center justify-center p-2.5 border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#F87171] text-xs">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions Footer */}
      {messages.length < 5 && (
        <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-[#27272A] bg-[#09090B]">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(action.text)}
              className="text-[10px] font-mono uppercase px-2 py-1 rounded-[2px] bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] border border-[#27272A] transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 border-t border-[#27272A] bg-[#09090B] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Enter command... (e.g. 'Show pipeline')"
          disabled={isLoading}
          className="flex-1 px-3 py-2 rounded-[2px] text-xs font-mono bg-[#18181B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] placeholder-[#71717A] focus:outline-none transition-colors"
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          className="px-3 py-2 rounded-[2px] bg-[#FAFAFA] text-[#09090B] hover:bg-[#E4E4E7] disabled:bg-[#18181B] disabled:text-[#71717A] border border-transparent disabled:border-[#27272A] transition-colors flex items-center justify-center font-bold text-xs"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
