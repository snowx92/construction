"use client";

import { useState } from "react";
import { Send, Zap, FileText, TrendingUp, Users, AlertTriangle, Plus } from "lucide-react";

const SUGGESTED_PROMPTS = [
  { icon: FileText,    text: "Analyze the Al Wasl Road tender risks" },
  { icon: TrendingUp,  text: "How do current steel prices affect my open bids?" },
  { icon: Users,       text: "Compare vendors for rebar supply" },
  { icon: AlertTriangle, text: "What are the critical contract clauses I should flag?" },
  { icon: Zap,         text: "Generate a BOQ for a 5-storey residential building" },
];

type Message = { role: "user" | "ai"; text: string; };

const DEMO_RESPONSES: Record<string, string> = {
  default: "I've analyzed your tender portfolio and current market data. Steel rebar (Y16) is up 8% this month — I recommend adjusting your unit rates on t-001 and t-003 before the June 15 deadline. Would you like me to generate updated pricing for those specific line items?",
};

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hello, Ahmed. I have full context on your 4 active tenders, 3 vendors, and live market pricing. What would you like to work on?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", text: DEMO_RESPONSES.default }]);
      setLoading(false);
    }, 1200);
  }

  return (
    <div className="flex h-screen flex-col" style={{ background: "var(--color-bg)" }}>

      {/* Header */}
      <div className="px-8 py-5 shrink-0" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--color-ai-sub)" }}>
              <Zap className="h-4 w-4" strokeWidth={1.5} style={{ color: "var(--color-ai)" }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>AI Copilot</p>
              <p className="text-xs" style={{ color: "var(--color-text-3)" }}>4 tenders · 3 vendors · live pricing</p>
            </div>
          </div>
          <button className="btn-ghost text-xs gap-1.5">
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            New conversation
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-thin">
        <div className="mx-auto max-w-3xl space-y-6">

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "ai" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mr-3 mt-0.5" style={{ background: "var(--color-ai-sub)" }}>
                  <Zap className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "var(--color-ai)" }} />
                </div>
              )}
              <div
                className={`max-w-[72%] rounded-[18px] px-5 py-3.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "rounded-tr-sm"
                    : "ai-mark rounded-tl-sm"
                }`}
                style={msg.role === "user"
                  ? { background: "var(--color-accent)", color: "oklch(99% 0 0)" }
                  : { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-2)" }
                }
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mr-3" style={{ background: "var(--color-ai-sub)" }}>
                <Zap className="h-3.5 w-3.5 animate-pulse-soft" strokeWidth={1.5} style={{ color: "var(--color-ai)" }} />
              </div>
              <div className="rounded-[18px] rounded-tl-sm px-5 py-3.5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-1.5 w-1.5 rounded-full animate-pulse-soft" style={{ background: "var(--color-ai)", animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suggested prompts */}
      {messages.length <= 1 && (
        <div className="px-8 pb-4">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-medium mb-3" style={{ color: "var(--color-text-3)" }}>Suggested prompts</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => sendMessage(text)}
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors hover:bg-sand-200/60"
                  style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-2)" }}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} style={{ color: "var(--color-accent)" }} />
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-8 pb-6 shrink-0">
        <div className="mx-auto max-w-3xl">
          <div
            className="flex items-end gap-3 rounded-[20px] px-4 py-3"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-float)" }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask about tenders, pricing, vendors, risks…"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm outline-none"
              style={{ color: "var(--color-text-1)", minHeight: "24px", maxHeight: "120px" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-all disabled:opacity-40"
              style={{ background: "var(--color-accent)" }}
            >
              <Send className="h-3.5 w-3.5 text-white" strokeWidth={2} />
            </button>
          </div>
          <p className="mt-2 text-center text-xs" style={{ color: "var(--color-text-3)" }}>
            Copilot has access to your tenders, vendors, and live pricing data
          </p>
        </div>
      </div>
    </div>
  );
}
