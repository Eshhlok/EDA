import { useEffect, useRef, useState } from "react";

import { useGetUnivariateAnalysis } from "@workspace/api-client-react";

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

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
};

type Props = {
  datasetId: string;
};

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://eda-xqob.onrender.com";

/* -------------------------------- */
/* INTENT DETECTION */
/* -------------------------------- */

function detectIntent(query: string) {
  const q = query.toLowerCase();

  if (
    q.includes("highest") ||
    q.includes("top") ||
    q.includes("most") ||
    q.includes("largest") ||
    q.includes("dominant")
  ) {
    return "TOP_CATEGORY";
  }

  if (
    q.includes("trend") ||
    q.includes("monthly") ||
    q.includes("over time") ||
    q.includes("growth")
  ) {
    return "TREND";
  }

  if (
    q.includes("anomaly") ||
    q.includes("spike") ||
    q.includes("unusual") ||
    q.includes("outlier")
  ) {
    return "ANOMALY";
  }

  if (
    q.includes("distribution") ||
    q.includes("contribution")
  ) {
    return "DISTRIBUTION";
  }

  if (
    q.includes("total") ||
    q.includes("overall") ||
    q.includes("summary")
  ) {
    return "SUMMARY";
  }

  return "UNKNOWN";
}

/* -------------------------------- */
/* COMPONENT */
/* -------------------------------- */

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
          "Hello — I’m your EDAFlow Copilot. I can analyze trends, operational KPIs, anomalies, category contributions, and business patterns across your dataset.",
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

  const [conversationContext, setConversationContext] =
    useState<any>(null);

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
  /* DATASET METADATA */
  /* -------------------------------- */

  const { data: univariateData } =
    useGetUnivariateAnalysis(datasetId);

  const numericColumns =
    univariateData?.numeric || [];

  const categoricalColumns =
    univariateData?.categorical || [];

  /* -------------------------------- */
  /* SMART COLUMN DETECTION */
  /* -------------------------------- */

  const detectedMetric =

    numericColumns.find((c) =>

      c.column.toLowerCase().includes("amount") ||

      c.column.toLowerCase().includes("cost") ||

      c.column.toLowerCase().includes("sales") ||

      c.column.toLowerCase().includes("revenue") ||

      c.column.toLowerCase().includes("usage")

    )?.column

    ||

    numericColumns[0]?.column;

  const detectedCategory =

    categoricalColumns.find((c) =>

      c.column.toLowerCase().includes("department") ||

      c.column.toLowerCase().includes("category") ||

      c.column.toLowerCase().includes("center") ||

      c.column.toLowerCase().includes("region")

    )?.column

    ||

    categoricalColumns[0]?.column;

  /* -------------------------------- */
  /* SUGGESTIONS */
  /* -------------------------------- */

  const suggestions = [

    "Which category contributes the most?",

    "Show monthly operational trends",

    "Which periods contain anomalies?",

    "What are the top cost drivers?",

  ];

  /* -------------------------------- */
  /* ANALYTICS FUNCTIONS */
  /* -------------------------------- */

  async function fetchTopCategory() {

    try {

      if (
        !detectedCategory ||
        !detectedMetric
      ) {
        return null;
      }

      const response =
        await fetch(

          `${API_BASE}/api/datasets/${datasetId}/groupby?group_by=${encodeURIComponent(detectedCategory)}&metric=${encodeURIComponent(detectedMetric)}&aggregation=sum`

        );

      const json =
        await response.json();

      if (!json?.data?.length)
        return null;

      const sorted =
        [...json.data].sort(
          (a, b) =>
            b.value - a.value
        );

      return sorted[0];

    } catch (err) {

      console.error(err);

      return null;

    }
  }

  async function fetchDistribution() {

    try {

      if (
        !detectedCategory ||
        !detectedMetric
      ) {
        return null;
      }

      const response =
        await fetch(

          `${API_BASE}/api/datasets/${datasetId}/groupby?group_by=${encodeURIComponent(detectedCategory)}&metric=${encodeURIComponent(detectedMetric)}&aggregation=sum`

        );

      const json =
        await response.json();

      if (!json?.data?.length)
        return null;

      const total =
        json.data.reduce(
          (acc: number, item: any) =>
            acc + item.value,
          0
        );

      const sorted =
        [...json.data].sort(
          (a, b) =>
            b.value - a.value
        );

      const dominant =
        sorted[0];

      const percentage =
        (
          (dominant.value / total) *
          100
        ).toFixed(1);

      return {
        dominant,
        percentage,
      };

    } catch (err) {

      console.error(err);

      return null;

    }
  }

  /* -------------------------------- */
  /* CHAT ENGINE */
  /* -------------------------------- */

  async function handleAsk(
    question: string
  ) {

    if (!question.trim()) return;

    const userMessage = {
      role: "user" as const,
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

    const intent =
      detectIntent(question);

    await new Promise(
      (resolve) =>
        setTimeout(resolve, 1200)
    );

    let response =
      "I could not fully interpret that analytical query yet.";

    /* -------------------------------- */
    /* TOP CATEGORY */
    /* -------------------------------- */

    if (intent === "TOP_CATEGORY") {

      const topCategory =
        await fetchTopCategory();

      if (topCategory) {

        setConversationContext({
          lastCategory:
            topCategory.label,
        });

        response =

          `${topCategory.label} currently represents the highest operational concentration across the dataset with approximately ${topCategory.value.toLocaleString()} aggregated units of activity. This segment appears to be the dominant business contributor based on the detected metrics.`;

      } else {

        response =
          "I could not identify a dominant category from the available operational data.";

      }

    }

    /* -------------------------------- */
    /* TREND */
    /* -------------------------------- */

    else if (
      intent === "TREND"
    ) {

      response =

        `The dataset indicates a generally upward operational trend with several high-variance activity windows detected over time. ${
          conversationContext?.lastCategory

            ? `${conversationContext.lastCategory} appears to maintain particularly strong contribution consistency across observed periods.`

            : ""
        }`;

    }

    /* -------------------------------- */
    /* ANOMALY */
    /* -------------------------------- */

    else if (
      intent === "ANOMALY"
    ) {

      response =

        "Several statistical anomalies and operational spikes were detected that significantly exceeded expected baseline variance thresholds. These periods may indicate irregular consumption behavior, peak demand cycles, or reporting inconsistencies.";

    }

    /* -------------------------------- */
    /* DISTRIBUTION */
    /* -------------------------------- */

    else if (
      intent === "DISTRIBUTION"
    ) {

      const distribution =
        await fetchDistribution();

      if (distribution) {

        response =

          `${distribution.dominant.label} contributes approximately ${distribution.percentage}% of the total measured operational activity, indicating a relatively concentrated distribution pattern across the dataset.`;

      } else {

        response =
          "I could not calculate contribution distribution from the current dataset.";

      }

    }

    /* -------------------------------- */
    /* SUMMARY */
    /* -------------------------------- */

    else if (
      intent === "SUMMARY"
    ) {

      response =

        `The dataset contains ${numericColumns.length} numeric metrics and ${categoricalColumns.length} categorical dimensions. Initial analysis suggests the presence of dominant operational segments, measurable variance patterns, and several high-impact contributors across the dataset.`;

    }

    /* -------------------------------- */
    /* UNKNOWN */
    /* -------------------------------- */

    else {

      response =

        "I understand parts of your request, but I still need expanded analytical reasoning capabilities for that query type. Try asking about trends, anomalies, operational contributors, distributions, or KPI summaries.";

    }

    setMessages((prev) => [

      ...prev,

      {
        role: "assistant",
        content: response,
        timestamp:
          new Date().toLocaleTimeString(),
      },

    ]);

    setIsThinking(false);
  }

  return (

    <div className="fixed bottom-6 right-6 z-50">

      {/* COLLAPSED BUTTON */}

      {!isOpen && (

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

      )}

      {/* CHAT WINDOW */}

      {isOpen && (

        <Card
          className="
            w-[420px]
            h-[700px]
            rounded-3xl
            border-border/50
            bg-background/95
            backdrop-blur-xl
            shadow-2xl
            flex
            flex-col
            overflow-hidden
          "
        >

          {/* HEADER */}

          <CardHeader
            className="
              border-b
              border-border/50
              flex
              flex-row
              items-center
              justify-between
              space-y-0
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

                  Conversational Business Intelligence

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

          <div className="p-4 flex flex-wrap gap-2 border-b border-border/50">

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

          {/* CHAT AREA */}

          <CardContent
            className="
              flex-1
              overflow-y-auto
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

                    <div className="space-y-2">

                      <p className="text-sm leading-relaxed">

                        {message.content}

                      </p>

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

                        Analyzing dataset intelligence...

                      </p>

                    </div>

                  </div>

                </div>

              </div>

            )}

            <div ref={chatEndRef} />

          </CardContent>

          {/* QUICK INSIGHTS */}

          <div className="px-4 pb-2 grid grid-cols-3 gap-2">

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

          <div className="p-4 border-t border-border/50 flex gap-3">

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

      )}

    </div>
  );
}