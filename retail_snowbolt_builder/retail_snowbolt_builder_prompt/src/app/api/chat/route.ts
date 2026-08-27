import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function POST(request: Request) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    let contextHint = "";
    if (context === "/") {
      contextHint =
        "The user is on the Promotional Calendar page showing trade promotion events in a Gantt chart and table view.";
    } else if (context?.includes("compliance")) {
      contextHint =
        "The user is on the Compliance Check page showing planned vs actual execution rates (price, display, feature compliance).";
    } else if (context?.includes("lifts")) {
      contextHint =
        "The user is on the Volume Lifts & ROI page showing incremental volume lift and return on investment by promotion.";
    } else if (context?.includes("optimization")) {
      contextHint =
        "The user is on the Trade Promotion Optimization page with elasticity curves and a what-if budget simulator.";
    }

    const systemPrompt = `You are a trade promotion analytics assistant for SnowBolt Energy's Indonesia Post-Event Analysis platform.
You help CPG trade marketing managers analyze promotional effectiveness across 10 Indonesian retailers and 30 PPGs (Price Pack Groups).

DATABASE: SNOWBOLT_TRADE_PROMO.TRADE_ANALYTICS

TABLES AND KEY COLUMNS:
- DIM_RETAILER: RETAILER_ID, RETAILER_NAME, COUNTRY (Indonesia), CHANNEL (Minimarket/Hypermarket/Supermarket), STORE_COUNT
- DIM_PPG: PPG_ID, PPG_NAME, PACK_SIZE (Single 250ml/4-Pack/6-Pack/12-Pack), SUGAR_VARIANT (Regular/Sugar Free/Zero), REGULAR_PRICE_IDR, CATEGORY (Core/Editions/Seasonal), IS_LIMITED_EDITION
- DIM_CALENDAR: WEEK_ID, WEEK_START, WEEK_END, YEAR (2025/2026), QUARTER (1-4), MONTH, PERIOD_NAME
- FACT_TRADE_CALENDAR: PROMO_ID, RETAILER_ID, PPG_ID, WEEK_START, WEEK_END, DISCOUNT_IDR, DISCOUNT_PCT, PROMO_TYPE (TPR/TPR+D/TPR+F/TPR+D+F), PLANNED_SPEND_IDR, PLANNED_VOLUME_CASES, COVERAGE, PLANNED_HAS_DISPLAY, PLANNED_HAS_FEATURE, STATUS
- FACT_POS_ACTUALS: POS_ID, RETAILER_ID, PPG_ID, WEEK_ID, ACTUAL_PRICE_IDR, ACTUAL_VOLUME_CASES, BASE_VOLUME_CASES, IS_ON_FEATURE, IS_ON_DISPLAY, IS_PROMOTED
- FACT_COMPLIANCE_SCORES: COMPLIANCE_ID, PROMO_ID, PRICE_ACCURACY_PCT, DISPLAY_COMPLIANCE_PCT, FEATURE_COMPLIANCE_PCT, OVERALL_COMPLIANCE_PCT, COMPLIANCE_STATUS (Compliant/Minor Deviation/Major Deviation/Non-Compliant)
- FACT_LIFT_ANALYSIS: LIFT_ID, PROMO_ID, BASE_VOLUME_CASES, INCREMENTAL_VOLUME_CASES, TOTAL_PROMOTED_VOLUME_CASES, LIFT_PCT, SPEND_IDR, INCREMENTAL_REVENUE_IDR, ROI

KEY RELATIONSHIPS:
- FACT tables join to DIM_RETAILER via RETAILER_ID
- FACT tables join to DIM_PPG via PPG_ID
- FACT_COMPLIANCE_SCORES and FACT_LIFT_ANALYSIS join to FACT_TRADE_CALENDAR via PROMO_ID
- FACT_POS_ACTUALS joins to DIM_CALENDAR via WEEK_ID
- PROMO_TYPE meanings: TPR=Temporary Price Reduction, D=Display support, F=Feature/advertising support

TERMINOLOGY:
- Lift = incremental volume % above base (higher is better, typically 15-40%)
- ROI = return on investment (>1.0 means profitable promotion)
- TPR = Temporary Price Reduction (basic); TPR+D+F = full support (most effective)
- PPG = Price Pack Group (product variant)
- POS = Point of Sale (actual checkout data)

${contextHint}

INSTRUCTIONS:
1. When the user asks a data question, generate ONE SQL query wrapped in \`\`\`sql ... \`\`\` to answer it.
2. Only generate SELECT or WITH statements. Never generate INSERT, UPDATE, DELETE, DROP, or DDL.
3. Keep queries efficient - use GROUP BY, LIMIT, and avoid SELECT *.
4. Before the SQL, give a brief (1-2 sentence) explanation of what you're looking at.
5. After the SQL, provide a brief interpretation note if helpful.
6. Format currency as IDR (Rupiah), volumes in cases. Use ROUND() for readability.
7. If the question is general or conceptual, answer directly without SQL.
8. Keep all responses concise and actionable - this is a demo platform.`;

    // Use Cortex LLM to generate a response
    const llmResult = await query<{ RESPONSE: string }>(
      `SELECT SNOWFLAKE.CORTEX.COMPLETE(
        'mistral-large2',
        CONCAT(?, '\\n\\nUser question: ', ?)
      ) AS RESPONSE`,
      [systemPrompt, message]
    );

    const llmResponse = llmResult[0]?.RESPONSE;

    if (!llmResponse) {
      return NextResponse.json({
        response:
          "I wasn't able to process your question. Please try rephrasing it.",
      });
    }

    // Check if the LLM generated a SQL query
    const sqlMatch = llmResponse.match(/```sql\s*([\s\S]*?)```/);

    if (sqlMatch) {
      try {
        const sqlQuery = sqlMatch[1].trim();
        // Safety check: only allow SELECT/WITH
        const upper = sqlQuery.toUpperCase().trimStart();
        if (!upper.startsWith("SELECT") && !upper.startsWith("WITH")) {
          return NextResponse.json({
            response:
              "I can only run read-only queries. Let me try to answer differently.",
          });
        }

        const results = await query<Record<string, unknown>>(sqlQuery);

        if (results.length === 0) {
          return NextResponse.json({
            response:
              "The query returned no results. Try broadening your filters or rephrasing the question.",
          });
        }

        // Build a text table of results (max 20 rows)
        const display = results.slice(0, 20);
        const cols = Object.keys(display[0]);
        let table = cols.join(" | ") + "\n";
        table += cols.map(() => "---").join(" | ") + "\n";
        display.forEach((row) => {
          table +=
            cols
              .map((c) => {
                const v = row[c];
                if (v === null || v === undefined) return "-";
                if (typeof v === "number") {
                  return v % 1 === 0
                    ? v.toLocaleString()
                    : Number(v).toFixed(2);
                }
                return String(v);
              })
              .join(" | ") + "\n";
        });

        const explanation = llmResponse.split("```sql")[0].trim().replace(/```/g, "");
        const afterSql = llmResponse.split(/```(?!sql)/)[1]?.trim() || "";

        return NextResponse.json({
          response: `${explanation}\n\n${table}${results.length > 20 ? `\n(Showing 20 of ${results.length} results)` : ""}${afterSql ? `\n\n${afterSql}` : ""}`,
        });
      } catch (sqlError) {
        console.error("SQL execution error:", sqlError);
        const textOnly = llmResponse.replace(/```sql[\s\S]*?```/g, "").trim();
        return NextResponse.json({
          response:
            textOnly ||
            "I tried to query the data but encountered an error. Please try rephrasing your question.",
        });
      }
    }

    // No SQL in response, just return the text
    return NextResponse.json({
      response: llmResponse.replace(/```/g, "").trim(),
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        response:
          "Sorry, I encountered an error. Please try again.",
      },
      { status: 500 }
    );
  }
}
