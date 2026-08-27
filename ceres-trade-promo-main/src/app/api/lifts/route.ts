import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const retailer = params.get("retailer");
    const quarter = params.get("quarter");

    let sql = `
      SELECT r.RETAILER_NAME, tc.PROMO_TYPE,
             ROUND(AVG(la.LIFT_PCT), 1) AS AVG_LIFT,
             ROUND(AVG(la.ROI), 2) AS AVG_ROI,
             ROUND(SUM(la.SPEND_IDR) / 1e6, 1) AS SPEND_M,
             ROUND(SUM(la.INCREMENTAL_REVENUE_IDR) / 1e6, 1) AS REVENUE_M,
             ROUND(SUM(la.INCREMENTAL_REVENUE_IDR) / NULLIF(SUM(la.SPEND_IDR), 0), 2) AS PORTFOLIO_ROI,
             COUNT(*) AS PROMO_COUNT
      FROM FACT_LIFT_ANALYSIS la
      JOIN FACT_TRADE_CALENDAR tc ON la.PROMO_ID = tc.PROMO_ID
      JOIN DIM_RETAILER r ON tc.RETAILER_ID = r.RETAILER_ID
      JOIN DIM_CALENDAR cal ON tc.WEEK_START = cal.WEEK_START
      WHERE 1=1
    `;
    const binds: (string | number)[] = [];

    if (retailer) { sql += ` AND tc.RETAILER_ID = ?`; binds.push(Number(retailer)); }
    if (quarter) {
      const [year, q] = quarter.split(" Q");
      sql += ` AND cal.YEAR = ? AND cal.QUARTER = ?`;
      binds.push(Number(year), Number(q));
    }

    sql += ` GROUP BY r.RETAILER_NAME, tc.PROMO_TYPE ORDER BY PORTFOLIO_ROI DESC`;

    const rows = await query(sql, binds);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Lifts API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
