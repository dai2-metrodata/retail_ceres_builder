import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function GET() {
  try {
    const rows = await query<{
      TOTAL_PROMOS: number;
      TOTAL_SPEND: number;
      AVG_DISCOUNT: number;
      AVG_ROI: number;
    }>(`
      SELECT
        COUNT(tc.PROMO_ID) AS TOTAL_PROMOS,
        SUM(tc.PLANNED_SPEND_IDR) AS TOTAL_SPEND,
        ROUND(AVG(tc.DISCOUNT_PCT), 1) AS AVG_DISCOUNT,
        ROUND(AVG(la.ROI), 2) AS AVG_ROI
      FROM FACT_TRADE_CALENDAR tc
      LEFT JOIN FACT_LIFT_ANALYSIS la ON tc.PROMO_ID = la.PROMO_ID
    `);
    return NextResponse.json(rows[0] || {});
  } catch (error) {
    console.error("Calendar meta API error:", error);
    return NextResponse.json({}, { status: 500 });
  }
}
