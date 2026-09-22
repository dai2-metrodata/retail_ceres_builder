"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, Table2, BarChart3, Maximize2, Minimize2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { CHART_COLORS } from "@/lib/format";
interface ChatTable {
  columns: string[];
  rows: (string | null)[][];
}

interface ChatChart {
  type: "bar" | "line";
  title: string;
  labelKey: string;
  valueKeys: string[];
  data: Record<string, string | number | null>[];
}

interface Message {
  role: "user" | "assistant";
  text: string;
  tables?: ChatTable[];
  charts?: ChatChart[];
}

type DataView = "table" | "chart";

function DataTableView({ table }: { table: ChatTable }) {
  return (
    <div className="overflow-x-auto mt-2 rounded border">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-muted/70">
            {table.columns.map((col, i) => (
              <th key={i} className="px-2 py-1.5 text-left font-semibold border-b whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? "" : "bg-muted/30"}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-2 py-1 border-b whitespace-nowrap">
                  {cell ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.rows.length >= 50 && (
        <p className="text-[10px] text-muted-foreground px-2 py-1">Showing first 50 rows</p>
      )}
    </div>
  );
}

function ChartView({ chart }: { chart: ChatChart }) {
  const ChartComponent = chart.type === "line" ? LineChart : BarChart;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const DataComponent = (chart.type === "line" ? Line : Bar) as any;

  return (
    <div className="mt-2">
      <p className="text-[10px] text-muted-foreground mb-1">{chart.title}</p>
      <ResponsiveContainer width="100%" height={200}>
        <ChartComponent data={chart.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey={chart.labelKey}
            tick={{ fontSize: 9 }}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis tick={{ fontSize: 9 }} width={50} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 6 }}
            formatter={(value: number) =>
              typeof value === "number" ? value.toLocaleString("id-ID") : value
            }
          />
          {chart.valueKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 10 }} />}
          {chart.valueKeys.map((key, i) => (
            <DataComponent
              key={key}
              type="monotone"
              dataKey={key}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              radius={chart.type === "bar" ? [2, 2, 0, 0] : undefined}
              {...(chart.type === "bar" ? {} : { dot: false, strokeWidth: 2 })}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

function DataBlock({ tables, charts }: { tables: ChatTable[]; charts: ChatChart[] }) {
  const hasCharts = charts.length > 0;
  const [view, setView] = useState<DataView>(hasCharts ? "chart" : "table");

  return (
    <div className="mt-1">
      {hasCharts && (
        <div className="flex gap-1 mb-1">
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded ${
              view === "table" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            <Table2 className="w-3 h-3" /> Table
          </button>
          <button
            onClick={() => setView("chart")}
            className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded ${
              view === "chart" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            <BarChart3 className="w-3 h-3" /> Chart
          </button>
        </div>
      )}
      {view === "table"
        ? tables.map((t, i) => <DataTableView key={i} table={t} />)
        : charts.map((c, i) => <ChartView key={i} chart={c} />)}
    </div>
  );
}

function formatTextContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    let content: React.ReactNode = line;

    if (line.startsWith("### ")) {
      return <p key={i} className="font-semibold mt-2 mb-0.5">{line.slice(4)}</p>;
    }
    if (line.startsWith("## ")) {
      return <p key={i} className="font-bold mt-2 mb-0.5">{line.slice(3)}</p>;
    }
    if (line.startsWith("# ")) {
      return <p key={i} className="font-bold text-sm mt-2 mb-0.5">{line.slice(2)}</p>;
    }

    // Bold
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    if (parts.length > 1) {
      content = parts.map((part, j) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={j}>{part.slice(2, -2)}</strong>
        ) : (
          <Fragment key={j}>{part}</Fragment>
        )
      );
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <p key={i} className="pl-3">
          <span className="mr-1">&#8226;</span>
          {typeof content === "string" ? content.slice(2) : content}
        </p>
      );
    }

    if (line.match(/^\d+\.\s/)) {
      return <p key={i} className="pl-3">{content}</p>;
    }

    if (line.trim() === "") return <br key={i} />;

    return <p key={i}>{content}</p>;
  });
}

export function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>();
  const pathname = usePathname();
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, context: pathname, threadId }),
      });
      const data = await res.json();
      if (data.threadId) setThreadId(data.threadId);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: data.text || data.response || "No response",
          tables: data.tables,
          charts: data.charts,
        },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Sorry, something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  const panelClass = expanded
    ? "fixed inset-4 bg-background border rounded-xl shadow-2xl flex flex-col z-50"
    : "fixed bottom-6 right-6 w-[480px] h-[600px] bg-background border rounded-xl shadow-2xl flex flex-col z-50";

  return (
    <div className={panelClass}>
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <h3 className="font-semibold text-sm">Ceres Trade AI</h3>
          <p className="text-xs text-muted-foreground">Ask about promotions, ROI, compliance</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground pt-8">
            <p>Ask me anything about trade promotions!</p>
            <p className="mt-2 text-xs">e.g. &quot;Which retailers had the highest ROI?&quot;</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`text-sm ${msg.role === "user" ? "text-right" : ""}`}>
            <div
              className={`inline-block max-w-[90%] px-3 py-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground whitespace-pre-wrap"
                  : "bg-muted text-foreground"
              }`}
            >
              {msg.role === "user" ? (
                msg.text
              ) : (
                <>
                  <div className="text-xs leading-relaxed">{formatTextContent(msg.text)}</div>
                  {msg.tables && msg.tables.length > 0 && (
                    <DataBlock tables={msg.tables} charts={msg.charts ?? []} />
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-sm">
            <div className="inline-block px-3 py-2 rounded-lg bg-muted animate-pulse">Thinking...</div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      <div className="p-3 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about trade promotions..."
            className="flex-1 h-9 px-3 rounded-md border bg-background text-sm"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="h-9 w-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
