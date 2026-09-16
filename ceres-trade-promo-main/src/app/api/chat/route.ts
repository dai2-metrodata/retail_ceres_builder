import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

const AGENT_FQN = "CERES_TRADE_PROMO.TRADE_ANALYTICS.CERES_PROMO_AGENT";

export interface ChatTable {
  columns: string[];
  rows: (string | null)[][];
}

export interface ChatChart {
  type: "bar" | "line";
  title: string;
  labelKey: string;
  valueKeys: string[];
  data: Record<string, string | number | null>[];
}

export interface ChatResponsePayload {
  text: string;
  tables: ChatTable[];
  charts: ChatChart[];
  threadId?: string;
}

function inferChart(cols: string[], rows: (string | null)[][]): ChatChart | null {
  if (cols.length < 2 || rows.length < 2 || rows.length > 50) return null;

  const numericColIndices: number[] = [];
  for (let c = 1; c < cols.length; c++) {
    const allNumeric = rows.every((r) => {
      const v = r[c];
      return v == null || v === "" || !isNaN(Number(v));
    });
    if (allNumeric) numericColIndices.push(c);
  }
  if (numericColIndices.length === 0) return null;

  const data = rows.map((row) => {
    const entry: Record<string, string | number | null> = { [cols[0]]: row[0] };
    for (const ci of numericColIndices) {
      entry[cols[ci]] = row[ci] != null ? Number(row[ci]) : null;
    }
    return entry;
  });

  return {
    type: "bar",
    title: numericColIndices.map((i) => cols[i]).join(" & ") + " by " + cols[0],
    labelKey: cols[0],
    valueKeys: numericColIndices.map((i) => cols[i]),
    data,
  };
}

export async function POST(request: Request) {
  try {
    const { message, context, threadId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    let contextHint = "";
    if (context === "/") {
      contextHint = " (User is viewing the Promotional Calendar page)";
    } else if (context?.includes("compliance")) {
      contextHint = " (User is viewing the Compliance Check page)";
    } else if (context?.includes("lifts")) {
      contextHint = " (User is viewing the Volume Lifts & ROI page)";
    } else if (context?.includes("optimization")) {
      contextHint = " (User is viewing the Trade Optimization page)";
    }

    const userMessage = message + contextHint;
    const requestBody = {
      messages: [{ role: "user", content: [{ type: "text", text: userMessage }] }],
      ...(threadId ? { thread_id: threadId, parent_message_id: 0 } : {}),
    };

    const requestJson = JSON.stringify(requestBody).replace(/\$\$/g, "\\$\\$");
    const sql = `SELECT SNOWFLAKE.CORTEX.DATA_AGENT_RUN('${AGENT_FQN}', $$${requestJson}$$)::STRING AS RESPONSE`;
    const agentResult = await query<{ RESPONSE: string }>(sql);

    const rawResponse = agentResult[0]?.RESPONSE;
    if (!rawResponse) {
      const payload: ChatResponsePayload = {
        text: "I wasn't able to process your question. Please try rephrasing it.",
        tables: [],
        charts: [],
      };
      return NextResponse.json(payload);
    }

    const parsed = JSON.parse(rawResponse);
    const responseThreadId = parsed.thread_id || threadId;
    let textContent = "";
    const tables: ChatTable[] = [];
    const charts: ChatChart[] = [];

    const content = parsed.content || (parsed.messages?.[0]?.content) || [];
    for (const block of content) {
      if (block.type === "text") {
        textContent += block.text + "\n";
      } else if (block.type === "table" && block.table?.result_set) {
        const data: (string | null)[][] = block.table.result_set.data ?? [];
        const cols: string[] =
          block.table.result_set.resultSetMetaData?.rowType?.map((r: { name: string }) => r.name) ?? [];
        if (cols.length > 0 && data.length > 0) {
          tables.push({ columns: cols, rows: data.slice(0, 50) });
          const chart = inferChart(cols, data);
          if (chart) charts.push(chart);
        }
      }
    }

    const payload: ChatResponsePayload = {
      text: textContent.trim() || "I processed your request but have no additional details to show.",
      tables,
      charts,
      threadId: responseThreadId,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Chat API error:", error);
    const payload: ChatResponsePayload = {
      text: "Sorry, I encountered an error. Please try again.",
      tables: [],
      charts: [],
    };
    return NextResponse.json(payload, { status: 500 });
  }
}
