import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function GET() {
  try {
    const rows = await query(
      `SELECT * FROM FACT_OPTIMIZATION_SCENARIOS WHERE IS_ACTIVE = TRUE ORDER BY CREATED_AT DESC LIMIT 20`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Scenarios GET error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, parameters, results } = body;

    await query(
      `INSERT INTO FACT_OPTIMIZATION_SCENARIOS (USER_ID, SCENARIO_NAME, PARAMETERS, RESULTS)
       SELECT CURRENT_USER(), ?, PARSE_JSON(?), PARSE_JSON(?)`,
      [name, JSON.stringify(parameters), JSON.stringify(results)]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Scenarios POST error:", error);
    return NextResponse.json({ error: "Failed to save scenario" }, { status: 500 });
  }
}
