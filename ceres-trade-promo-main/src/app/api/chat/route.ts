import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function POST(request: Request) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    let contextHint = "";
    if (context === "/") {
      contextHint = "The user is on the Promotional Calendar page showing trade promotion events.";
    } else if (context?.includes("compliance")) {
      contextHint = "The user is on the Compliance Check page showing execution rates.";
    } else if (context?.includes("lifts")) {
      contextHint = "The user is on the Volume Lifts & ROI page.";
    } else if (context?.includes("optimization")) {
      contextHint = "The user is on the Trade Optimization page with what-if scenarios.";
    }

    const systemPrompt = `You are a trade promotion analytics assistant for Ceres Indonesia.
You help CPG trade marketing managers analyze promotional effectiveness across 10 Indonesian retailers and 30 PPGs.

DATABASE: CERES_TRADE_PROMO.TRADE_ANALYTICS

TABLES: DIM_RETAILER, DIM_PPG, DIM_CALENDAR, FACT_TRADE_CALENDAR, FACT_POS_ACTUALS, FACT_COMPLIANCE_SCORES, FACT_LIFT_ANALYSIS

KEY JOINS:
- FACT tables join DIM_RETAILER via RETAILER_ID, DIM_PPG via PPG_ID
- FACT_COMPLIANCE_SCORES and FACT_LIFT_ANALYSIS join FACT_TRADE_CALENDAR via PROMO_ID
- FACT_TRADE_CALENDAR joins DIM_CALENDAR via WEEK_START
- PROMO_TYPE: TPR, TPR+D, TPR+F, TPR+D+F

${contextHint}

INSTRUCTIONS:
1. For data questions, generate ONE SQL query wrapped in \`\`\`sql ... \`\`\`
2. Only SELECT/WITH statements. Never INSERT/UPDATE/DELETE/DROP.
3. Format currency as IDR (Rupiah). Use ROUND() for readability.
4. Keep responses concise and actionable.`;

    const llmResult = await query<{ RESPONSE: string }>(

      `SELECT SNOWFLAKE.CORTEX.COMPLETE('mistral-large2-2407', CONCAT(?, '\\n\\nUser question: ', ?)) AS RESPONSE`,

      [systemPrompt, message]
    );

    const llmResponse = llmResult[0]?.RESPONSE;
    if (!llmResponse) {
      return NextResponse.json({ response: "I wasn't able to process your question. Please try rephrasing it." });
    }

    const sqlMatch = llmResponse.match(/```sql\s*([\s\S]*?)```/);
    if (sqlMatch) {
      try {
        const sqlQuery = sqlMatch[1].trim();
        const upper = sqlQuery.toUpperCase().trimStart();
        if (!upper.startsWith("SELECT") && !upper.startsWith("WITH")) {
          return NextResponse.json({ response: "I can only run read-only queries." });
        }

        const results = await query<Record<string, unknown>>(sqlQuery);
        if (results.length === 0) {
          return NextResponse.json({ response: "The query returned no results. Try broadening your filters." });
        }

        const display = results.slice(0, 20);
        const cols = Object.keys(display[0]);
        let table = cols.join(" | ") + "\n" + cols.map(() => "---").join(" | ") + "\n";
        display.forEach((row) => {
          table += cols.map((c) => {
            const v = row[c];
            if (v === null || v === undefined) return "-";
            if (typeof v === "number") return v % 1 === 0 ? v.toLocaleString() : Number(v).toFixed(2);
            return String(v);
          }).join(" | ") + "\n";
        });

        const explanation = llmResponse.split("```sql")[0].trim().replace(/```/g, "");
        const afterSql = llmResponse.split(/```(?!sql)/)[1]?.trim() || "";

        return NextResponse.json({
          response: `${explanation}\n\n${table}${results.length > 20 ? `\n(Showing 20 of ${results.length} results)` : ""}${afterSql ? `\n\n${afterSql}` : ""}`,
        });
      } catch (sqlError) {
        console.error("SQL execution error:", sqlError);
        const textOnly = llmResponse.replace(/```sql[\s\S]*?```/g, "").trim();
        return NextResponse.json({ response: textOnly || "I encountered a query error. Please try rephrasing." });
      }
    }

    return NextResponse.json({ response: llmResponse.replace(/```/g, "").trim() });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ response: "Sorry, I encountered an error. Please try again." }, { status: 500 });
  }
}
