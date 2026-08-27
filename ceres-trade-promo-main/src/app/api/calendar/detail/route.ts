import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function GET(request: NextRequest) {
  try {
    const promoId = request.nextUrl.searchParams.get("id");
    if (!promoId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const rows = await query(
      `SELECT tc.*, r.RETAILER_NAME, p.PPG_NAME, p.PACK_SIZE, p.PRODUCT_VARIANT,
              la.LIFT_PCT, la.ROI, la.SPEND_IDR, la.INCREMENTAL_REVENUE_IDR,
              la.BASE_VOLUME_CASES, la.INCREMENTAL_VOLUME_CASES,
              cs.OVERALL_COMPLIANCE_PCT, cs.PRICE_ACCURACY_PCT,
              cs.DISPLAY_COMPLIANCE_PCT, cs.FEATURE_COMPLIANCE_PCT, cs.COMPLIANCE_STATUS
       FROM FACT_TRADE_CALENDAR tc
       JOIN DIM_RETAILER r ON tc.RETAILER_ID = r.RETAILER_ID
       JOIN DIM_PPG p ON tc.PPG_ID = p.PPG_ID
       LEFT JOIN FACT_LIFT_ANALYSIS la ON tc.PROMO_ID = la.PROMO_ID
       LEFT JOIN FACT_COMPLIANCE_SCORES cs ON tc.PROMO_ID = cs.PROMO_ID
       WHERE tc.PROMO_ID = ?`,
      [Number(promoId)]
    );
    return NextResponse.json(rows[0] || null);
  } catch (error) {
    console.error("Calendar detail API error:", error);
    return NextResponse.json(null, { status: 500 });
  }
}
