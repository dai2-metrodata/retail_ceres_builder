"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  ClipboardCheck,
  TrendingUp,
  Settings2,
  Upload,
  MessageSquare,
  X,
  Send,
  Moon,
  Sun,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Promotional Calendar", icon: Calendar, step: 1 },
  { href: "/compliance", label: "Compliance Check", icon: ClipboardCheck, step: 2 },
  { href: "/lifts", label: "Volume Lifts & ROI", icon: TrendingUp, step: 3 },
  { href: "/optimization", label: "Optimization", icon: Settings2, step: 4 },
  { href: "/upload", label: "Upload Calendar", icon: Upload, step: 5 },
];

const suggestedPrompts = [
  "Which retailer has the highest average ROI?",
  "Show total spend by promo type",
  "What is the avg compliance score by country?",
  "Which PPG has the highest lift percentage?",
  "Compare TPR vs TPR+D effectiveness",
  "Top 5 promotions by incremental revenue",
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO string for serialization
}

const STORAGE_KEY = "snowbolt-chat-history";

function loadChatHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [
    {
      role: "assistant",
      content:
        "Hello! I can help you analyze your trade promotion data. Ask me anything about promotions, compliance, volume lifts, or ROI across your SnowBolt Energy Indonesia portfolio.\n\nTry one of the suggested prompts below, or type your own question.",
      timestamp: new Date().toISOString(),
    },
  ];
}

function saveChatHistory(messages: ChatMessage[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // ignore quota errors
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(loadChatHistory);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("snowbolt-dark-mode");
    if (stored === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("snowbolt-dark-mode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("snowbolt-dark-mode", "false");
    }
  }

  // Persist chat history
  useEffect(() => {
    saveChatHistory(chatMessages);
  }, [chatMessages]);

  // Track scroll for glassmorphism header
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const handler = () => setScrolled(main.scrollTop > 8);
    main.addEventListener("scroll", handler, { passive: true });
    return () => main.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleChatSubmit = useCallback(
    async (message: string) => {
      if (!message.trim() || chatLoading) return;

      const userMessage: ChatMessage = {
        role: "user",
        content: message.trim(),
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, userMessage]);
      setChatInput("");
      setChatLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage.content,
            context: pathname,
          }),
        });
        const data = await res.json();
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              data.response || "I encountered an error processing your request.",
            timestamp: new Date().toISOString(),
          },
        ]);
      } catch {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Sorry, I encountered a connection error. Please try again.",
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setChatLoading(false);
      }
    },
    [chatLoading, pathname]
  );

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleChatSubmit(chatInput);
  }

  function clearChat() {
    const initial: ChatMessage[] = [
      {
        role: "assistant",
        content:
          "Chat cleared. Ask me anything about your trade promotion data!",
        timestamp: new Date().toISOString(),
      },
    ];
    setChatMessages(initial);
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className={cn(
        "flex h-[72px] shrink-0 items-center justify-between border-b px-6 transition-all duration-200",
        scrolled
          ? "bg-snowbolt-dark/90 glass shadow-z8"
          : "bg-snowbolt-dark"
      )}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/snowbolt-logo.svg"
              alt="SnowBolt Energy"
              className="h-7"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-none text-white">
                Trade Promotions
              </span>
              <span className="text-[10px] leading-none text-snowbolt-silver">
                Post-Event Analysis | Indonesia
              </span>
            </div>
          </div>

          <nav className="ml-8 flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-white/60 hover:bg-white/10 hover:text-white/90"
                  )}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-5 w-5 justify-center rounded-full border p-0 text-[10px]",
                      isActive
                        ? "border-snowbolt-blue bg-snowbolt-blue text-white"
                        : "border-white/30 text-white/60"
                    )}
                  >
                    {item.step}
                  </Badge>
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/60 hover:bg-white/10 hover:text-white"
            onClick={toggleDarkMode}
            title={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <img
            src="/made_with_snowflake.png"
            alt="Made with Snowflake Cortex Code"
            className="h-6 opacity-80"
          />
        </div>
      </header>

      {/* Main content area with optional chat sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>

        {/* AI Chat Sidebar */}
        {chatOpen && (
          <aside className="flex w-[400px] shrink-0 flex-col border-l bg-card shadow-z8">
            {/* Chat header */}
            <div className="flex items-center justify-between border-b px-4 py-3 glass bg-card/80">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-snowbolt-blue" />
                <span className="text-sm font-semibold">AI Assistant</span>
                <Badge variant="secondary" className="text-[9px]">
                  Cortex LLM
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={clearChat}
                  title="Clear chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setChatOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat messages */}
            <ScrollArea className="flex-1 px-4 py-3">
              <div className="space-y-4">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex flex-col gap-1",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[90%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap",
                        msg.role === "user"
                          ? "bg-snowbolt-dark text-white"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-start">
                    <div className="max-w-[90%] rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                      <span className="inline-flex gap-1">
                        <span className="animate-bounce">.</span>
                        <span className="animate-bounce [animation-delay:0.2s]">
                          .
                        </span>
                        <span className="animate-bounce [animation-delay:0.4s]">
                          .
                        </span>
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            {/* Suggested prompts */}
            {chatMessages.length <= 2 && !chatLoading && (
              <div className="border-t border-dashed px-4 py-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3 w-3 text-snowbolt-cyan" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Suggested
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      className="rounded-md border border-border/60 bg-background px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                      onClick={() => handleChatSubmit(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat input */}
            <form
              onSubmit={handleFormSubmit}
              className="flex items-center gap-2 border-t px-4 py-3"
            >
              <Input
                placeholder="Ask about your promotions..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 text-sm"
                disabled={chatLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 shrink-0 bg-snowbolt-blue hover:bg-snowbolt-blue/90"
                disabled={!chatInput.trim() || chatLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </aside>
        )}
      </div>

      {/* Floating Ask AI button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105",
          chatOpen
            ? "bg-white/15 text-white backdrop-blur-sm"
            : "bg-snowbolt-blue text-white hover:bg-snowbolt-blue/90"
        )}
        title="Ask AI"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    </div>
  );
}
