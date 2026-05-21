import { useState } from "react";

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
} from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const [isThinking, setIsThinking] =
  useState(false);

export default function AskDataset() {

  const [input, setInput] =
    useState("");

  const [messages, setMessages] =
    useState<Message[]>([
      {
        role: "assistant",
        content:
          "Hello — I’m your AI analytics copilot. Ask anything about your dataset.",
      },
    ]);

  const suggestions = [

    "Which category contributes the most?",

    "Show monthly operational trends",

    "Which periods contain anomalies?",

    "What are the top cost drivers?",

  ];

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

        response =
        "Operations appears to contribute the highest overall operational value concentration across the dataset.";

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

    <div className="p-6 space-y-6">

      {/* HEADER */}

      <Card className="glass-card executive-border rounded-3xl">

        <CardHeader>

          <div className="flex items-center gap-3">

            <div
              className="
                h-12
                w-12
                rounded-2xl
                bg-primary/10
                flex
                items-center
                justify-center
              "
            >

              <Sparkles className="h-6 w-6 text-primary" />

            </div>

            <div>

              <CardTitle className="text-2xl">

                Ask Your Dataset

              </CardTitle>

              <p className="text-sm text-muted-foreground mt-1">

                Conversational AI-powered business intelligence

              </p>

            </div>

          </div>

        </CardHeader>

      </Card>

      {/* SUGGESTIONS */}

      <div className="flex flex-wrap gap-3">

        {suggestions.map((suggestion) => (

          <Button
            key={suggestion}
            variant="outline"
            className="
              rounded-2xl
              border-border/50
              bg-card/40
              hover:bg-primary/10
            "
            onClick={() =>
              handleAsk(suggestion)
            }
          >

            {suggestion}

          </Button>

        ))}

      </div>

      {/* CHAT */}

      <div className="space-y-4">

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
                max-w-3xl
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

                  <Bot className="h-5 w-5 mt-0.5 text-primary" />

                )}

                <p className="text-sm leading-relaxed">

                  {message.content}

                </p>

              </div>

            </div>

          </div>

        ))}

      </div>
       
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
      {/* INPUT */}

      <div className="flex gap-3">

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
            px-6
            rounded-2xl
          "
          onClick={() =>
            handleAsk(input)
          }
        >

          <Send className="h-4 w-4" />

        </Button>

      </div>

    </div>
  );
}