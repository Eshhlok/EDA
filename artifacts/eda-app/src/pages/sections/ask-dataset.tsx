import { useEffect, useRef, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

  metrics?: Record<string, any>;
};

type Props = {
  datasetId: string;
};

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://eda-xqob.onrender.com";

export default function AskDataset({
  datasetId,
}: Props) {

  const [input, setInput] =
    useState("");

  const [isThinking, setIsThinking] =
    useState(false);

  const [isOpen, setIsOpen] =
    useState(false);

  const [messages, setMessages] =
    useState<Message[]>([
      {
        role: "assistant",

        content:
          "Hello — I’m your EDAFlow Copilot. I can analyze dataset quality, anomalies, trends, correlations, forecasting readiness, and business intelligence patterns across your data.",

        timestamp:
          new Date().toLocaleTimeString(),

        severity: "low",
      },
    ]);

  const chatEndRef =
    useRef<HTMLDivElement | null>(null);

  /* -------------------------------- */
  /* AUTO SCROLL */
  /* -------------------------------- */

  useEffect(() => {

    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages, isThinking]);

  /* -------------------------------- */
  /* SUGGESTIONS */
  /* -------------------------------- */

  const suggestions = [

    "Is this dataset clean?",

    "Are there anomalies in the dataset?",

    "Can this dataset be used for forecasting?",

    "What columns are correlated?",

  ];

  /* -------------------------------- */
  /* COPILOT ENGINE */
  /* -------------------------------- */

  async function handleAsk(
    question: string
  ) {

    if (!question.trim()) return;

    const userMessage: Message = {
      role: "user",

      content: question,

      timestamp:
        new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setInput("");

    setIsThinking(true);

    try {

      const response =
        await fetch(

          `${API_BASE}/api/copilot/query`,

          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              dataset_id: datasetId,
              message: question,
            }),
          }
        );

      const data =
        await response.json();

      const aiMessage: Message = {

        role: "assistant",

        content:
          data.message ||
          "Analysis completed successfully.",

        timestamp:
          new Date().toLocaleTimeString(),

        severity:
          data.severity || "low",

        insights:
          data.insights || [],

        recommendations:
          data.recommendations || [],

        charts:
          data.charts || [],

        metrics:
          data.metrics || {},
      };

      setMessages((prev) => [
        ...prev,
        aiMessage,
      ]);

    } catch (error) {

      console.error(error);

      setMessages((prev) => [

        ...prev,

        {
          role: "assistant",

          content:
            "EDAFlow Copilot could not complete the analysis request. Please try again.",

          timestamp:
            new Date().toLocaleTimeString(),

          severity: "high",
        },

      ]);

    } finally {

      setIsThinking(false);

    }
  }

  return (

    <>

      {/* COLLAPSED BUTTON */}

      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() =>
            setIsOpen(true)
          }
          className="
            h-14
            px-5
            rounded-2xl
            shadow-2xl
            flex
            items-center
            gap-2
          "
        >

          <Sparkles className="h-5 w-5" />

          EDAFlow Copilot

        </Button>
        </div>
      )}

      {/* CHAT WINDOW */}

      {isOpen && (

        <Rnd
          style={{
            position: "fixed",
            zIndex: 9999,
          }}
          default={{
            x: window.innerWidth - 450,
            y: window.innerHeight - 760,
            width: 420,
            height: 700,
          }}

          minWidth={380}

          minHeight={500}

          bounds="window"

          dragHandleClassName="copilot-drag-handle"
        >

          <Card
            className="
              w-full
              h-full
              rounded-3xl
              border-border/50
              bg-background/95
              backdrop-blur-xl
              shadow-2xl
              flex
              flex-col
              overflow-hidden
              min-h-0
            "
          >

            {/* HEADER */}

            <CardHeader
              className="
                copilot-drag-handle
                border-b
                border-border/50
                flex
                flex-row
                items-center
                justify-between
                space-y-0
                shrink-0
              "
            >

              <div className="flex items-center gap-3">

                <div
                  className="
                    h-10
                    w-10
                    rounded-2xl
                    bg-primary/10
                    flex
                    items-center
                    justify-center
                  "
                >

                  <Sparkles className="h-5 w-5 text-primary" />

                </div>

                <div>

                  <CardTitle className="text-lg">

                    EDAFlow Copilot

                  </CardTitle>

                  <p className="text-xs text-muted-foreground">

                    Conversational Intelligence Engine

                  </p>

                </div>

              </div>

              <div className="flex items-center gap-2">

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setIsOpen(false)
                  }
                >

                  <Minimize2 className="h-4 w-4" />

                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setIsOpen(false)
                  }
                >

                  <X className="h-4 w-4" />

                </Button>

              </div>

            </CardHeader>

            {/* SUGGESTIONS */}

            <div
              className="
                p-4
                flex
                flex-wrap
                gap-2
                border-b
                border-border/50
                shrink-0
              "
            >

              {suggestions.map((suggestion) => (

                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="
                    rounded-xl
                    text-xs
                  "
                  onClick={() =>
                    handleAsk(suggestion)
                  }
                >

                  {suggestion}

                </Button>

              ))}

            </div>

            {/* SCROLLABLE MESSAGE REGION */}

            <div className="flex-1 min-h-0 overflow-hidden">

              <CardContent
                className="
                  h-full
                  overflow-y-auto
                  overflow-x-hidden
                  p-4
                  space-y-4
                "
              >

                {messages.map((message, index) => (

                  <div
                    key={index}
                    className={`
                      flex
                      ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }
                    `}
                  >

                    <div
                      className={`
                        max-w-[85%]
                        rounded-3xl
                        px-5
                        py-4
                        border
                        ${
                          message.role === "assistant"

                            ? `
                              bg-card/50
                              border-border/50
                            `

                            : `
                              bg-primary
                              text-primary-foreground
                              border-primary
                            `
                        }
                      `}
                    >

                      <div className="flex items-start gap-3">

                        {message.role ===
                          "assistant" && (

                          <Bot className="h-5 w-5 mt-0.5 text-primary shrink-0" />

                        )}

                        <div className="space-y-3 w-full">

                          {/* SEVERITY */}

                          {message.role ===
                            "assistant" &&

                            message.severity && (

                            <div
                              className={`
                                inline-flex
                                rounded-full
                                px-2
                                py-1
                                text-[10px]
                                font-medium

                                ${
                                  message.severity === "high"

                                    ? `
                                      bg-red-500/10
                                      text-red-400
                                    `

                                    : message.severity === "medium"

                                    ? `
                                      bg-yellow-500/10
                                      text-yellow-400
                                    `

                                    : `
                                      bg-emerald-500/10
                                      text-emerald-400
                                    `
                                }
                              `}
                            >

                              {message.severity.toUpperCase()}

                            </div>

                          )}

                          {/* MAIN MESSAGE */}

                          <p className="text-sm leading-relaxed">

                            {message.content}

                          </p>

                          {/* INSIGHTS */}

                          {message.insights &&
                            message.insights.length > 0 && (

                            <div className="grid grid-cols-2 gap-2">

                              {message.insights.map(
                                (insight, idx) => (

                                  <div
                                    key={idx}
                                    className="
                                      rounded-2xl
                                      border
                                      border-border/50
                                      bg-muted/30
                                      p-3
                                    "
                                  >

                                    <div className="text-[10px] text-muted-foreground">

                                      {insight.label}

                                    </div>

                                    <div className="text-lg font-bold mt-1">

                                      {insight.value}

                                    </div>

                                  </div>

                                )
                              )}

                            </div>

                          )}

                          {/* RECOMMENDATIONS */}

                          {message.recommendations &&
                            message.recommendations.length > 0 && (

                            <div className="space-y-2">

                              {message.recommendations.map(
                                (rec, idx) => (

                                  <div
                                    key={idx}
                                    className="
                                      rounded-xl
                                      border
                                      border-amber-500/20
                                      bg-amber-500/5
                                      px-3
                                      py-2
                                      text-xs
                                    "
                                  >

                                    • {rec}

                                  </div>

                                )
                              )}

                            </div>

                          )}

                          {/* TIMESTAMP */}

                          <p className="text-[10px] opacity-60">

                            {message.timestamp}

                          </p>

                        </div>

                      </div>

                    </div>

                  </div>

                ))}

                {/* THINKING */}

                {isThinking && (

                  <div className="flex justify-start">

                    <div
                      className="
                        max-w-sm
                        rounded-3xl
                        px-5
                        py-4
                        border
                        bg-card/50
                        border-border/50
                      "
                    >

                      <div className="flex items-center gap-3">

                        <Bot className="h-5 w-5 text-primary" />

                        <div className="space-y-2">

                          <div className="flex gap-1">

                            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />

                            <div
                              className="
                                h-2
                                w-2
                                rounded-full
                                bg-primary
                                animate-bounce
                                delay-100
                              "
                            />

                            <div
                              className="
                                h-2
                                w-2
                                rounded-full
                                bg-primary
                                animate-bounce
                                delay-200
                              "
                            />

                          </div>

                          <p className="text-xs text-muted-foreground">

                            EDAFlow Copilot is orchestrating analytics intelligence...

                          </p>

                        </div>

                      </div>

                    </div>

                  </div>

                )}

                <div ref={chatEndRef} />

              </CardContent>

            </div>

            {/* QUICK INSIGHTS */}

            <div
              className="
                px-4
                pb-2
                grid
                grid-cols-3
                gap-2
                shrink-0
              "
            >

              <div className="rounded-2xl border p-3 bg-card/30">

                <div className="flex items-center gap-2 mb-1">

                  <TrendingUp className="h-4 w-4 text-primary" />

                  <span className="text-xs font-medium">

                    Trends

                  </span>

                </div>

                <p className="text-[10px] text-muted-foreground">

                  Detect operational growth patterns

                </p>

              </div>

              <div className="rounded-2xl border p-3 bg-card/30">

                <div className="flex items-center gap-2 mb-1">

                  <AlertTriangle className="h-4 w-4 text-primary" />

                  <span className="text-xs font-medium">

                    Anomalies

                  </span>

                </div>

                <p className="text-[10px] text-muted-foreground">

                  Identify statistical outliers

                </p>

              </div>

              <div className="rounded-2xl border p-3 bg-card/30">

                <div className="flex items-center gap-2 mb-1">

                  <BarChart3 className="h-4 w-4 text-primary" />

                  <span className="text-xs font-medium">

                    KPIs

                  </span>

                </div>

                <p className="text-[10px] text-muted-foreground">

                  Business intelligence summaries

                </p>

              </div>

            </div>

            {/* INPUT */}

            <div
              className="
                p-4
                border-t
                border-border/50
                flex
                gap-3
                shrink-0
              "
            >

              <Input
                value={input}

                onChange={(e) =>
                  setInput(e.target.value)
                }

                placeholder="Ask anything about your dataset..."

                className="
                  h-12
                  rounded-2xl
                "

                onKeyDown={(e) => {

                  if (e.key === "Enter") {
                    handleAsk(input);
                  }

                }}
              />

              <Button
                className="
                  h-12
                  px-5
                  rounded-2xl
                "
                onClick={() =>
                  handleAsk(input)
                }
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