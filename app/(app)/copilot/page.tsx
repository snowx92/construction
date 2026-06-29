"use client";

import { useState } from "react";
import { Send, Zap, FileText, TrendingUp, Users, AlertTriangle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

type Message = { role: "user" | "ai"; text: string; };

const DEMO_RESPONSES: Record<string, string> = {
  default: "I've analyzed your tender portfolio and current market data. Steel rebar (Y16) is up 8% this month — I recommend adjusting your unit rates on t-001 and t-003 before the June 15 deadline. Would you like me to generate updated pricing for those specific line items?",
};

export default function CopilotPage() {
  const t = useT();

  const SUGGESTED_PROMPTS = [
    { icon: FileText,    text: t("copilot.promptAnalyze") },
    { icon: TrendingUp,  text: t("copilot.promptSteelPrices") },
    { icon: Users,       text: t("copilot.promptCompareVendors") },
    { icon: AlertTriangle, text: t("copilot.promptContractClauses") },
    { icon: Zap,         text: t("copilot.promptGenerateBoq") },
  ];

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
    <div className="flex h-screen flex-col">

      {/* Header */}
      <div className="px-8 py-5 shrink-0 border-b border-black/[0.06]">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft">
              <Zap className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t("nav.copilot")}</p>
              <p className="text-xs text-foreground-subtle">{t("copilot.contextLine")}</p>
            </div>
          </div>
          <button className={cn(
            "inline-flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-pill)] text-foreground-muted text-sm font-medium transition-all duration-500 ease-out hover:bg-black/[0.04] hover:text-foreground",
            "text-xs gap-1.5"
          )}>
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            {t("copilot.newConversation")}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-thin">
        <div className="mx-auto max-w-3xl space-y-6">

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "ai" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mr-3 mt-0.5 bg-primary-soft">
                  <Zap className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[72%] rounded-[18px] px-5 py-3.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "rounded-tr-sm bg-primary text-white"
                    : "ai-mark rounded-tl-sm bg-surface border border-black/[0.06] text-foreground-muted"
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mr-3 bg-primary-soft">
                <Zap className="h-3.5 w-3.5 animate-pulse-soft text-primary" strokeWidth={1.5} />
              </div>
              <div className="rounded-[18px] rounded-tl-sm px-5 py-3.5 bg-surface border border-black/[0.06]">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-1.5 w-1.5 rounded-full animate-pulse-soft bg-primary" style={{ animationDelay: `${i * 0.2}s` }} />
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
            <p className="text-xs font-medium mb-3 text-foreground-subtle">{t("copilot.suggestedPrompts")}</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => sendMessage(text)}
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors hover:bg-black/[0.04] bg-surface border border-black/[0.06] text-foreground-muted"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.5} />
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
            className="flex items-end gap-3 rounded-[20px] px-4 py-3 bg-surface border border-black/[0.06] shadow-lg"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder={t("copilot.placeholder")}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm outline-none text-foreground"
              style={{ minHeight: "24px", maxHeight: "120px" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-all disabled:opacity-40 bg-primary"
            >
              <Send className="h-3.5 w-3.5 text-white" strokeWidth={2} />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-foreground-subtle">
            {t("copilot.footer")}
          </p>
        </div>
      </div>
    </div>
  );
}
