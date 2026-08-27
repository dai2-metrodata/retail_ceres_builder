import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function GET() {
  try {
    const rows = await query(`
      SELECT tc.PROMO_TYPE,
             ROUND(AVG(tc.DISCOUNT_PCT), 1) AS AVG_DISCOUNT,
             ROUND(AVG(la.LIFT_PCT), 1) AS AVG_LIFT,
             ROUND(AVG(la.ROI), 2) AS AVG_ROI,
             COUNT(*) AS PROMO_COUNT,
             ROUND(SUM(la.SPEND_IDR) / 1e9, 2) AS TOTAL_SPEND_B,
             ROUND(SUM(la.INCREMENTAL_REVENUE_IDR) / 1e9, 2) AS TOTAL_REVENUE_B
      FROM FACT_TRADE_CALENDAR tc
      JOIN FACT_LIFT_ANALYSIS la ON tc.PROMO_ID = la.PROMO_ID
      GROUP BY tc.PROMO_TYPE
      ORDER BY AVG_ROI DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Optimization API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
