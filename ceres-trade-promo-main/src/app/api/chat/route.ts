import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

const AGENT_FQN = "CERES_TRADE_PROMO.TRADE_ANALYTICS.CERES_PROMO_AGENT";

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
      ...(threadId ? { thread_id: threadId } : {}),
    };
    const agentResult = await query<{ RESPONSE: string }>(
      `SELECT SNOWFLAKE.CORTEX.DATA_AGENT_RUN('${AGENT_FQN}', PARSE_JSON(?))::STRING AS RESPONSE`,
      [JSON.stringify(requestBody)]
    );

    const rawResponse = agentResult[0]?.RESPONSE;
    if (!rawResponse) {
      return NextResponse.json({ response: "I wasn't able to process your question. Please try rephrasing it." });
    }

    const parsed = JSON.parse(rawResponse);
    const responseThreadId = parsed.thread_id || threadId;
    let textContent = "";
    let sqlResults: Record<string, unknown>[] | null = null;

    if (parsed.messages && Array.isArray(parsed.messages)) {
      for (const msg of parsed.messages) {
        if (msg.role === "assistant" && msg.content) {
          for (const block of msg.content) {
            if (block.type === "text") {
              textContent += block.text + "\n";
            } else if (block.type === "tool_results") {
              for (const tool of block.tools || []) {
                if (tool.results && Array.isArray(tool.results) && tool.results.length > 0) {
                  sqlResults = tool.results.slice(0, 20);
                }
              }
            }
          }
        }
      }
    }

    let formattedResponse = textContent.trim();
    if (sqlResults && sqlResults.length > 0) {
      const cols = Object.keys(sqlResults[0]);
      let table = "\n\n" + cols.join(" | ") + "\n" + cols.map(() => "---").join(" | ") + "\n";
      sqlResults.forEach((row) => {
        table += cols.map((c) => {
          const v = row[c];
          if (v === null || v === undefined) return "-";
          if (typeof v === "number") return v % 1 === 0 ? v.toLocaleString() : Number(v).toFixed(2);
          return String(v);
        }).join(" | ") + "\n";
      });
      formattedResponse += table;
    }

    return NextResponse.json({
      response: formattedResponse || "I processed your request but have no additional details to show.",
      threadId: responseThreadId,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ response: "Sorry, I encountered an error. Please try again." }, { status: 500 });
  }
}
