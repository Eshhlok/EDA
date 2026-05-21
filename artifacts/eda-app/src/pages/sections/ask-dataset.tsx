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

  function handleAsk(question: string) {

    if (!question.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: question,
      },
      {
        role: "assistant",
        content:
          "AI query engine integration coming next...",
      },
    ]);

    setInput("");
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