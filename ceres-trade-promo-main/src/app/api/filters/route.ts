import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function GET() {
  try {
    const [retailers, ppgs, quarters, promoTypes] = await Promise.all([
      query<{ RETAILER_ID: number; RETAILER_NAME: string }>(
        "SELECT RETAILER_ID, RETAILER_NAME FROM DIM_RETAILER ORDER BY RETAILER_NAME"
      ),
      query<{ PPG_ID: number; PPG_NAME: string }>(
        "SELECT PPG_ID, PPG_NAME FROM DIM_PPG ORDER BY PPG_NAME"
      ),
      query<{ QTR: string }>(
        "SELECT DISTINCT YEAR || ' Q' || QUARTER AS QTR FROM DIM_CALENDAR ORDER BY QTR"
      ),
      query<{ PROMO_TYPE: string }>(
        "SELECT DISTINCT PROMO_TYPE FROM FACT_TRADE_CALENDAR ORDER BY PROMO_TYPE"
      ),
    ]);

    return NextResponse.json({
      retailers: retailers.map((r) => ({ id: r.RETAILER_ID, name: r.RETAILER_NAME })),
      ppgs: ppgs.map((p) => ({ id: p.PPG_ID, name: p.PPG_NAME })),
      quarters: quarters.map((q) => q.QTR),
      promoTypes: promoTypes.map((t) => t.PROMO_TYPE),
    });
  } catch (error) {
    console.error("Filters API error:", error);
    return NextResponse.json({ retailers: [], ppgs: [], quarters: [], promoTypes: [] });
  }
}
