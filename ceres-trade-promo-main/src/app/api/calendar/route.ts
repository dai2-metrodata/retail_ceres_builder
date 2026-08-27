import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const retailer = params.get("retailer");
    const ppg = params.get("ppg");
    const quarter = params.get("quarter");
    const promoType = params.get("promoType");

    let sql = `
      SELECT tc.PROMO_ID, tc.WEEK_START, tc.WEEK_END, tc.DISCOUNT_PCT, tc.PROMO_TYPE,
             tc.PLANNED_SPEND_IDR, tc.PLANNED_VOLUME_CASES, tc.STATUS, tc.COVERAGE,
             r.RETAILER_NAME, p.PPG_NAME, p.PACK_SIZE
      FROM FACT_TRADE_CALENDAR tc
      JOIN DIM_RETAILER r ON tc.RETAILER_ID = r.RETAILER_ID
      JOIN DIM_PPG p ON tc.PPG_ID = p.PPG_ID
      JOIN DIM_CALENDAR cal ON tc.WEEK_START = cal.WEEK_START
      WHERE 1=1
    `;
    const binds: (string | number)[] = [];

    if (retailer) { sql += ` AND tc.RETAILER_ID = ?`; binds.push(Number(retailer)); }
    if (ppg) { sql += ` AND tc.PPG_ID = ?`; binds.push(Number(ppg)); }
    if (quarter) {
      const [year, q] = quarter.split(" Q");
      sql += ` AND cal.YEAR = ? AND cal.QUARTER = ?`;
      binds.push(Number(year), Number(q));
    }
    if (promoType) { sql += ` AND tc.PROMO_TYPE = ?`; binds.push(promoType); }

    sql += ` ORDER BY tc.WEEK_START DESC LIMIT 500`;

    const rows = await query(sql, binds);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
