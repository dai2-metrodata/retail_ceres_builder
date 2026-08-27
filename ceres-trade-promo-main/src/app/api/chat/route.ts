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
      ...(threadId ? { thread_id: threadId, parent_message_id: 0 } : {}),
    };

    // DATA_AGENT_RUN requires the second argument to be a constant string literal.
    // We use $$ dollar-quoting and escape any $$ in the JSON payload.
    const requestJson = JSON.stringify(requestBody).replace(/\$\$/g, "\\$\\$");
    const sql = `SELECT SNOWFLAKE.CORTEX.DATA_AGENT_RUN('${AGENT_FQN}', $$${requestJson}$$)::STRING AS RESPONSE`;
    const agentResult = await query<{ RESPONSE: string }>(sql);

    const rawResponse = agentResult[0]?.RESPONSE;
    if (!rawResponse) {
      return NextResponse.json({ response: "I wasn't able to process your question. Please try rephrasing it." });
    }

    const parsed = JSON.parse(rawResponse);
    const responseThreadId = parsed.thread_id || threadId;
    let textContent = "";
    let tableData: string[][] | null = null;
    let tableCols: string[] | null = null;

    // Response is a single message object with role/content at top level
    const content = parsed.content || (parsed.messages?.[0]?.content) || [];
    for (const block of content) {
      if (block.type === "text") {
        textContent += block.text + "\n";
      } else if (block.type === "table" && block.table?.result_set) {
        tableData = block.table.result_set.data;
        tableCols = block.table.result_set.resultSetMetaData?.rowType?.map((r: { name: string }) => r.name);
      }
    }

    let formattedResponse = textContent.trim();

    if (tableData && tableCols && tableData.length > 0) {
      let table = "\n\n" + tableCols.join(" | ") + "\n" + tableCols.map(() => "---").join(" | ") + "\n";
      tableData.slice(0, 20).forEach((row) => {
        table += row.map((v) => v ?? "-").join(" | ") + "\n";
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
