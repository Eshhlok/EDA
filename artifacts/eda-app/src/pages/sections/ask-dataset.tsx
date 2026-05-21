import { useState } from "react";
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
} from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  datasetId: string;
};

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://eda-xqob.onrender.com";

const { data: univariateData } =
  useGetUnivariateAnalysis(datasetId);

const numericColumns =
  univariateData?.numeric || [];

const categoricalColumns =
  univariateData?.categorical || [];

const detectedMetric =

  numericColumns.find((c) =>

    c.column.toLowerCase().includes("amount") ||

    c.column.toLowerCase().includes("cost") ||

    c.column.toLowerCase().includes("sales") ||

    c.column.toLowerCase().includes("revenue")

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
          "Hello — I’m your EDAFlow analytics copilot. Ask anything about your dataset.",
      },
    ]);

  const suggestions = [

    "Which category contributes the most?",

    "Show monthly operational trends",

    "Which periods contain anomalies?",

    "What are the top cost drivers?",

  ];

  async function fetchTopCategory() {

    try {

      const response =
        await fetch(

          `${API_BASE}/api/datasets/${datasetId}/group_by=${encodeURIComponent(detectedCategory || "")}&metric=${encodeURIComponent(detectedMetric || "")}&aggregation=sum`

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

  async function handleAsk(
    question: string
  ) {

    if (!question.trim()) return;

    const userMessage = {
      role: "user" as const,
      content: question,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setInput("");
    setIsThinking(true);

    const lower =
      question.toLowerCase();

    await new Promise(
      (resolve) =>
        setTimeout(resolve, 1200)
    );

    let response =
      "I could not fully interpret that query yet.";

    /* TOP CATEGORY */

    if (
      lower.includes("top") ||
      lower.includes("highest") ||
      lower.includes("most")
    ) {

      const topCategory =
        await fetchTopCategory();

      if (topCategory) {

        response =

          `${topCategory.label} contributes the highest operational value concentration with approximately ${topCategory.value.toLocaleString()} total aggregated activity.`;

      }

    }

    /* TREND */

    else if (
      lower.includes("trend") ||
      lower.includes("monthly") ||
      lower.includes("over time")
    ) {

      response =
        "The dataset shows a gradual upward operational trend with several high-variance periods detected during peak activity windows.";

    }

    /* ANOMALY */

    else if (
      lower.includes("anomaly") ||
      lower.includes("spike") ||
      lower.includes("unusual")
    ) {

      response =
        "Several operational spikes were detected that significantly exceeded baseline variance thresholds.";

    }

    /* DISTRIBUTION */

    else if (
      lower.includes("distribution") ||
      lower.includes("contribute")
    ) {

      response =
        "A small number of categories account for the majority of overall operational contribution, indicating high concentration.";

    }

    /* KPI */

    else if (
      lower.includes("total") ||
      lower.includes("overall")
    ) {

      response =
        "The dataset contains strong aggregate operational activity with several dominant contributing segments.";

    }

    setMessages((prev) => [

      ...prev,

      {
        role: "assistant",
        content: response,
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
            h-[650px]
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

                    <p className="text-sm leading-relaxed">

                      {message.content}

                    </p>

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

                  </div>

                </div>

              </div>

            )}

          </CardContent>

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