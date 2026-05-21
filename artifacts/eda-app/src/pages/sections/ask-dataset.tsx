import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bot,
  Sparkles,
  Send,
  X,
  Minimize2,
  TrendingUp,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { Rnd } from "react-rnd";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type Insight = {
  label: string;
  value: string | number;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  severity?: "low" | "medium" | "high";
  insights?: Insight[];
  recommendations?: string[];
  charts?: string[];
  metrics?: Record<string, unknown>;
};

type Props = {
  datasetId: string;
};

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const API_BASE =
  (typeof import.meta !== "undefined" && (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL) ||
  "https://eda-xqob.onrender.com";

const WINDOW_WIDTH = 420;
const WINDOW_HEIGHT = 700;
const EDGE_GAP = 24; // px from viewport edge

const SUGGESTIONS = [
  "Is this dataset clean?",
  "Are there anomalies in the dataset?",
  "Can this dataset be used for forecasting?",
  "What columns are correlated?",
];

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hello — I'm your EDAFlow Copilot. I can analyze dataset quality, anomalies, trends, correlations, forecasting readiness, and business intelligence patterns across your data.",
  timestamp: new Date().toLocaleTimeString(),
  severity: "low",
};

/* ─────────────────────────────────────────────
   Helper — safe initial position
   Keeps the window fully inside the viewport
───────────────────────────────────────────── */
function getInitialPosition() {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 900;

  return {
    x: Math.max(EDGE_GAP, vw - WINDOW_WIDTH - EDGE_GAP),
    y: Math.max(EDGE_GAP, vh - WINDOW_HEIGHT - EDGE_GAP),
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
  };
}

/* ─────────────────────────────────────────────
   Severity badge
───────────────────────────────────────────── */
function SeverityBadge({ severity }: { severity: "low" | "medium" | "high" }) {
  const styles = {
    high: "bg-red-500/10 text-red-400",
    medium: "bg-yellow-500/10 text-yellow-400",
    low: "bg-emerald-500/10 text-emerald-400",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${styles[severity]}`}
    >
      {severity.toUpperCase()}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function AskDataset({ datasetId }: Props) {
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);

  // Compute once at mount so window.innerWidth is always available
  const [rndDefault] = useState(getInitialPosition);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  /* ── auto-scroll ── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  /* ── focus input when panel opens ── */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  /* ── ask handler ── */
  async function handleAsk(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isThinking) return;

    const userMsg: Message = {
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    try {
      const res = await fetch(`${API_BASE}/api/copilot/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset_id: datasetId, message: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      const aiMsg: Message = {
        role: "assistant",
        content: data.message || "Analysis completed successfully.",
        timestamp: new Date().toLocaleTimeString(),
        severity: data.severity || "low",
        insights: Array.isArray(data.insights) ? data.insights : [],
        recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
        charts: Array.isArray(data.charts) ? data.charts : [],
        metrics: data.metrics && typeof data.metrics === "object" ? data.metrics : {},
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("[EDAFlow Copilot]", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "EDAFlow Copilot could not complete the analysis request. Please check your connection and try again.",
          timestamp: new Date().toLocaleTimeString(),
          severity: "high",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  /* ── keyboard shortcut: Escape closes panel ── */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  /* ─────────────────────────────────────────
     Render
  ───────────────────────────────────────── */
  return (
    <>
      {/* ── Collapsed trigger button ── */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 px-5 rounded-2xl shadow-2xl flex items-center gap-2"
          >
            <Sparkles className="h-5 w-5" />
            EDAFlow Copilot
          </Button>
        </div>
      )}

      {/* ── Draggable / resizable chat window ── */}
      {isOpen && (
        <Rnd
          default={rndDefault}
          minWidth={380}
          minHeight={520}
          maxWidth={680}
          maxHeight={900}
          bounds="window"
          dragHandleClassName="copilot-drag-handle"
          style={{ zIndex: 9999 }}
          enableResizing={{
            top: true,
            right: true,
            bottom: true,
            left: true,
            topRight: true,
            bottomRight: true,
            bottomLeft: true,
            topLeft: true,
          }}
        >
          <Card className="w-full h-full rounded-3xl border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">

            {/* ── Header (drag handle) ── */}
            <CardHeader className="copilot-drag-handle cursor-grab active:cursor-grabbing border-b border-border/50 flex flex-row items-center justify-between space-y-0 shrink-0 select-none">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">EDAFlow Copilot</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Conversational Intelligence Engine
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Minimise"
                  onClick={() => setIsOpen(false)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Close"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            {/* ── Suggestion chips ── */}
            <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-border/50 shrink-0">
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  disabled={isThinking}
                  className="rounded-xl text-xs"
                  onClick={() => handleAsk(s)}
                >
                  {s}
                </Button>
              ))}
            </div>

            {/* ── Message list ── */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <CardContent className="h-full overflow-y-auto overflow-x-hidden p-4 space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-3xl px-5 py-4 border ${
                        msg.role === "assistant"
                          ? "bg-card/50 border-border/50"
                          : "bg-primary text-primary-foreground border-primary"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {msg.role === "assistant" && (
                          <Bot className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                        )}
                        <div className="space-y-3 w-full min-w-0">
                          {msg.role === "assistant" && msg.severity && (
                            <SeverityBadge severity={msg.severity} />
                          )}

                          <p className="text-sm leading-relaxed break-words">
                            {msg.content}
                          </p>

                          {/* Insight cards */}
                          {msg.insights && msg.insights.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                              {msg.insights.map((ins, idx) => (
                                <div
                                  key={idx}
                                  className="rounded-2xl border border-border/50 bg-muted/30 p-3"
                                >
                                  <div className="text-[10px] text-muted-foreground">
                                    {ins.label}
                                  </div>
                                  <div className="text-lg font-bold mt-1">
                                    {ins.value}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Recommendations */}
                          {msg.recommendations && msg.recommendations.length > 0 && (
                            <div className="space-y-2">
                              {msg.recommendations.map((rec, idx) => (
                                <div
                                  key={idx}
                                  className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs"
                                >
                                  • {rec}
                                </div>
                              ))}
                            </div>
                          )}

                          <p className="text-[10px] opacity-50">{msg.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Thinking indicator */}
                {isThinking && (
                  <div className="flex justify-start">
                    <div className="max-w-sm rounded-3xl px-5 py-4 border bg-card/50 border-border/50">
                      <div className="flex items-center gap-3">
                        <Bot className="h-5 w-5 text-primary shrink-0" />
                        <div className="space-y-2">
                          <div className="flex gap-1">
                            {[0, 150, 300].map((delay) => (
                              <div
                                key={delay}
                                className="h-2 w-2 rounded-full bg-primary animate-bounce"
                                style={{ animationDelay: `${delay}ms` }}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Orchestrating analytics intelligence…
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </CardContent>
            </div>

            {/* ── Quick insight pills ── */}
            <div className="px-4 pb-2 grid grid-cols-3 gap-2 shrink-0">
              {[
                { Icon: TrendingUp, label: "Trends", desc: "Detect growth patterns" },
                { Icon: AlertTriangle, label: "Anomalies", desc: "Identify outliers" },
                { Icon: BarChart3, label: "KPIs", desc: "BI summaries" },
              ].map(({ Icon, label, desc }) => (
                <div key={label} className="rounded-2xl border p-3 bg-card/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>

            {/* ── Input bar ── */}
            <div className="p-4 border-t border-border/50 flex gap-3 shrink-0">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your dataset…"
                className="h-12 rounded-2xl"
                disabled={isThinking}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk(input);
                  }
                }}
              />
              <Button
                className="h-12 px-5 rounded-2xl"
                disabled={isThinking || !input.trim()}
                onClick={() => handleAsk(input)}
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

          </Card>
        </Rnd>
      )}
    </>
  );
}