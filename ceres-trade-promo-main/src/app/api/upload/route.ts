import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      return NextResponse.json({ error: "File must have a header and at least one data row" }, { status: 400 });
    }

    const headers = lines[0].split(",").map((h) => h.trim().toUpperCase());
    const requiredCols = ["RETAILER_ID", "PPG_ID", "WEEK_START", "DISCOUNT_PCT", "PROMO_TYPE", "PLANNED_SPEND_IDR"];
    const missing = requiredCols.filter((c) => !headers.includes(c));
    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing columns: ${missing.join(", ")}` }, { status: 400 });
    }

    let inserted = 0;
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(",").map((v) => v.trim());
      if (vals.length < headers.length) continue;

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = vals[idx]; });

      const promoType = row["PROMO_TYPE"] || "TPR";
      await query(
        `INSERT INTO FACT_TRADE_CALENDAR (RETAILER_ID, PPG_ID, WEEK_START, WEEK_END, DISCOUNT_PCT, PROMO_TYPE, PLANNED_SPEND_IDR, PLANNED_VOLUME_CASES, COVERAGE, PLANNED_HAS_DISPLAY, PLANNED_HAS_FEATURE, STATUS)
         VALUES (?, ?, ?::DATE, ?::DATE, ?, ?, ?, ?, 'National', ?, ?, 'PLANNED')`,
        [
          Number(row["RETAILER_ID"]), Number(row["PPG_ID"]),
          row["WEEK_START"], row["WEEK_END"] || row["WEEK_START"],
          Number(row["DISCOUNT_PCT"]), promoType,
          Number(row["PLANNED_SPEND_IDR"]), Number(row["PLANNED_VOLUME_CASES"] || "1000"),
          promoType.includes("+D"), promoType.includes("+F"),
        ]
      );
      inserted++;
    }

    return NextResponse.json({ success: true, inserted });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
