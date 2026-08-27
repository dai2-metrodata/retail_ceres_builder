import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const retailer = params.get("retailer");
    const quarter = params.get("quarter");

    let sql = `
      SELECT r.RETAILER_NAME,
             ROUND(AVG(cs.OVERALL_COMPLIANCE_PCT), 1) AS AVG_OVERALL,
             ROUND(AVG(cs.PRICE_ACCURACY_PCT), 1) AS AVG_PRICE,
             ROUND(AVG(cs.DISPLAY_COMPLIANCE_PCT), 1) AS AVG_DISPLAY,
             ROUND(AVG(cs.FEATURE_COMPLIANCE_PCT), 1) AS AVG_FEATURE,
             COUNT_IF(cs.COMPLIANCE_STATUS = 'COMPLIANT') AS COMPLIANT_COUNT,
             COUNT_IF(cs.COMPLIANCE_STATUS = 'PARTIAL') AS PARTIAL_COUNT,
             COUNT_IF(cs.COMPLIANCE_STATUS = 'NON-COMPLIANT') AS NONCOMPLIANT_COUNT,
             COUNT(*) AS TOTAL
      FROM FACT_COMPLIANCE_SCORES cs
      JOIN FACT_TRADE_CALENDAR tc ON cs.PROMO_ID = tc.PROMO_ID
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

    sql += ` GROUP BY r.RETAILER_NAME ORDER BY AVG_OVERALL DESC`;

    const rows = await query(sql, binds);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Compliance API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
