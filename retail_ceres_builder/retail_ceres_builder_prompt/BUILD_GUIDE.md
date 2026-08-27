# Ceres Trade Promotions — AI Builder Prompt

> This document instructs an AI agent to recreate and deploy this app from scratch
> on any Snowflake account. Follow each section in order.

---

## Overview

**What this app is:**
A 5-page trade promotion post-event analytics application for an FMCG (Ceres) in the Indonesian market. It connects to Snowflake, queries live trade data, and includes an AI Chat powered by Snowflake Cortex.

**Tech stack:**
- Next.js 16 (App Router, Turbopack)
- React 19
- Tailwind CSS 4 + shadcn/ui (Radix primitives)
- Recharts (charts)
- snowflake-sdk (server-side queries via API routes)
- Snowflake Cortex LLM for AI Chat (`SNOWFLAKE.CORTEX.COMPLETE()`)
- Docker (standalone) for SPCS deployment

**Pages:**
1. **Promotional Calendar** (`/`) — KPIs, filters, sortable table of all promos
2. **Compliance Check** (`/compliance`) — Execution scoring: price accuracy, display, feature
3. **Volume Lifts & ROI** (`/lifts`) — Post-event measurement: lift %, ROI, POS actuals
4. **Trade Optimization** (`/optimization`) — Forward-looking scenario modeling
5. **Upload Calendar** (`/upload`) — CSV upload for new promo plans

**AI Chat** — Floating chat bubble (bottom-right on every page), uses `mistral-large2` via `SNOWFLAKE.CORTEX.COMPLETE()`

---

## File Structure

```
ceres-trade-promo-main/
├── package.json                  # Next.js 16 + deps
├── next.config.ts                # standalone output + snowflake-sdk external
├── tsconfig.json
├── Dockerfile                    # Multi-stage Docker build for SPCS
├── service-spec.yaml             # SPCS service spec
├── run-dev.sh                    # Local dev with key-pair auth
├── postcss.config.mjs            # Tailwind 4 PostCSS
├── components.json               # shadcn/ui config
├── public/                       # Static assets (logos, template xlsx)
├── snowflake/                    # SQL setup + seed + semantic model
│   ├── 01-setup.sql              # CREATE DATABASE, SCHEMA, TABLES
│   ├── 02-seed-dimensions.sql    # DIM_RETAILER, DIM_PPG, DIM_CALENDAR
│   ├── 03-seed-facts.sql         # FACT_TRADE_CALENDAR, COMPLIANCE, LIFT, POS
│   ├── 04-spcs-deploy.sql        # SPCS image repo, service, endpoint
│   ├── 05-extend-to-june-2026.sql # Optional: extends data range
│   └── ceres_semantic_model.yaml # Cortex Analyst semantic view spec
└── src/
    ├── app/
    │   ├── layout.tsx            # Root layout with AppShell nav
    │   ├── page.tsx              # Page 1: Promotional Calendar
    │   ├── compliance/page.tsx   # Page 2: Compliance Check
    │   ├── lifts/page.tsx        # Page 3: Volume Lifts & ROI
    │   ├── optimization/page.tsx # Page 4: Trade Optimization
    │   ├── upload/page.tsx       # Page 5: Upload Calendar
    │   └── api/                  # Server-side API routes (Snowflake queries)
    │       ├── calendar/route.ts       # GET promotions list
    │       ├── calendar/meta/route.ts  # GET KPI summary
    │       ├── calendar/detail/route.ts# GET single promo detail
    │       ├── compliance/route.ts     # GET compliance data
    │       ├── lifts/route.ts          # GET lift/ROI data
    │       ├── optimization/route.ts   # GET optimization data
    │       ├── optimization/scenarios/route.ts # GET/POST scenarios
    │       ├── filters/route.ts        # GET filter options
    │       ├── chat/route.ts           # POST AI Chat (Cortex LLM)
    │       └── upload/route.ts         # POST CSV upload
    ├── components/
    │   ├── app-shell.tsx         # Navigation header with numbered tabs
    │   ├── filter-bar.tsx        # Shared filter component
    │   ├── promo-detail-modal.tsx
    │   ├── error-boundary.tsx
    │   └── ui/                   # shadcn/ui primitives (18 components)
    └── lib/
        ├── snowflake.ts          # Connection manager (4-path auth chain)
        ├── format.ts             # formatIDR(), formatPct(), etc.
        ├── use-filters.ts        # React hook for filter state
        ├── csv-export.ts         # Client-side CSV download
        ├── calendar-utils.ts     # Calendar helpers
        └── utils.ts              # cn() tailwind merge utility
```

---

## Deployment Environments & Auth Configuration

The app supports 4 authentication methods, auto-selected in priority order:

### 1. SPCS (Snowpark Container Services) — Production

The app reads an OAuth token from `/snowflake/session/token` (mounted by SPCS runtime).

**Environment variables needed:** None (auto-detected)

**How SPCS provides credentials:**
- Token file: `/snowflake/session/token`
- Host: `SNOWFLAKE_HOST` env var (set by SPCS)
- Authenticator: `oauth`

### 2. Password / PAT (Personal Access Token)

Set `SNOWFLAKE_PASSWORD` env var.

```bash
export SNOWFLAKE_ACCOUNT="ORGID-ACCOUNT_NAME"
export SNOWFLAKE_USER="USERNAME"
export SNOWFLAKE_PASSWORD="your_pat_or_password"
```

### 3. Key-Pair JWT (Recommended for local dev)

Set `SNOWFLAKE_PRIVATE_KEY_PATH` to a `.p8` private key file.

```bash
export SNOWFLAKE_ACCOUNT="ORGID-ACCOUNT_NAME"
export SNOWFLAKE_USER="USERNAME"
export SNOWFLAKE_PRIVATE_KEY_PATH="~/.ssh/rsa_key.p8"
# Optional: export SNOWFLAKE_PRIVATE_KEY_PASSPHRASE="passphrase"
```

### 4. External Browser (fallback, local only)

If none of the above are set, falls back to browser-based SSO. Only works in interactive local environments — not headless servers.

---

## Setup Instructions for a New Account

### Step 1: Create Database and Tables

Run `snowflake/01-setup.sql` on the target Snowflake account. This creates:
- Database: `CERES_TRADE_PROMO`
- Schema: `TRADE_ANALYTICS`
- 7 tables (4 fact + 3 dimension)

### Step 2: Seed Dimension Data

Run `snowflake/02-seed-dimensions.sql`. This loads:
- 10 Indonesian retailers (Indomaret, Alfamart, Carrefour, etc.)
- 30 PPGs (product/pack groups) at 3 price tiers (Rp 12k, 14k, 16k)
- 78 weeks of calendar (Jan 2025 – Jul 2026)

### Step 3: Seed Fact Data

Run `snowflake/03-seed-facts.sql`. This generates (via Snowflake RANDOM/UNIFORM):
- ~1,768 promotions in FACT_TRADE_CALENDAR
- Matching compliance scores
- Matching lift analysis (ROI, volume lift)
- ~8,700 POS actual records

### Step 4 (Optional): Extend Data

Run `snowflake/05-extend-to-june-2026.sql` to add March–June 2026 data (~500 more promos).

### Step 5: Adjust for Story

After seeding, run these targeted updates to create a clear Q1→Q2 improvement narrative:

**Make Q2 ROI slightly profitable (target ~1.2×):**
```sql
UPDATE FACT_LIFT_ANALYSIS la
SET INCREMENTAL_REVENUE_IDR = ROUND(la.SPEND_IDR * (0.3 + UNIFORM(0, 1.8, RANDOM())), 0)
WHERE la.PROMO_ID IN (
  SELECT tc.PROMO_ID FROM FACT_TRADE_CALENDAR tc
  JOIN DIM_CALENDAR cal ON tc.WEEK_START = cal.WEEK_START
  WHERE cal.YEAR = 2025 AND cal.QUARTER = 2
);
UPDATE FACT_LIFT_ANALYSIS SET ROI = ROUND(INCREMENTAL_REVENUE_IDR / NULLIF(SPEND_IDR, 0), 2)
WHERE PROMO_ID IN (SELECT tc.PROMO_ID FROM FACT_TRADE_CALENDAR tc
  JOIN DIM_CALENDAR cal ON tc.WEEK_START = cal.WEEK_START WHERE cal.YEAR = 2025 AND cal.QUARTER = 2);
```

**Make Q2 compliance much better than Q1:**
```sql
UPDATE FACT_COMPLIANCE_SCORES cs
SET
  PRICE_ACCURACY_PCT     = ROUND(LEAST(100, GREATEST(55, 60 + UNIFORM(0, 40, RANDOM()))), 1),
  DISPLAY_COMPLIANCE_PCT = CASE WHEN tc.PLANNED_HAS_DISPLAY
    THEN ROUND(LEAST(100, GREATEST(60, 65 + UNIFORM(0, 35, RANDOM()))), 1) ELSE 100.0 END,
  FEATURE_COMPLIANCE_PCT = CASE WHEN tc.PLANNED_HAS_FEATURE
    THEN ROUND(LEAST(100, GREATEST(65, 70 + UNIFORM(0, 30, RANDOM()))), 1) ELSE 100.0 END
FROM FACT_TRADE_CALENDAR tc
JOIN DIM_CALENDAR cal ON tc.WEEK_START = cal.WEEK_START
WHERE cs.PROMO_ID = tc.PROMO_ID AND cal.YEAR = 2025 AND cal.QUARTER = 2;

UPDATE FACT_COMPLIANCE_SCORES cs
SET OVERALL_COMPLIANCE_PCT = ROUND((PRICE_ACCURACY_PCT + DISPLAY_COMPLIANCE_PCT + FEATURE_COMPLIANCE_PCT)/3, 1),
    COMPLIANCE_STATUS = CASE
      WHEN (PRICE_ACCURACY_PCT + DISPLAY_COMPLIANCE_PCT + FEATURE_COMPLIANCE_PCT)/3 >= 85 THEN 'COMPLIANT'
      WHEN (PRICE_ACCURACY_PCT + DISPLAY_COMPLIANCE_PCT + FEATURE_COMPLIANCE_PCT)/3 >= 60 THEN 'PARTIAL'
      ELSE 'NON-COMPLIANT' END
FROM FACT_TRADE_CALENDAR tc JOIN DIM_CALENDAR cal ON tc.WEEK_START = cal.WEEK_START
WHERE cs.PROMO_ID = tc.PROMO_ID AND cal.YEAR = 2025 AND cal.QUARTER = 2;
```

### Step 6: Create Semantic View

```sql
CALL SYSTEM$CREATE_SEMANTIC_VIEW_FROM_YAML(
  'CERES_TRADE_PROMO.TRADE_ANALYTICS',
  $$<contents of snowflake/ceres_semantic_model.yaml>$$
);
```

### Step 7: Create Cortex Agent

```sql
CREATE OR REPLACE AGENT CERES_TRADE_PROMO.TRADE_ANALYTICS.CERES_PROMO_AGENT
  COMMENT = 'Ceres Trade Promotion Analytics Agent'
  PROFILE = '{"display_name": "Ceres Trade AI", "color": "blue"}'
  FROM SPECIFICATION $$
models:
  orchestration: auto
orchestration:
  budget:
    seconds: 60
    tokens: 32000
instructions:
  response: |
    You are the Ceres Trade Promotions AI assistant for Indonesia.
    Present monetary values in IDR (Rp prefix). ROI above 1.0 = profitable.
  orchestration: |
    Use trade_promotions_analyst for ALL data questions.
    Use data_to_chart only when user explicitly requests a visualization.
  sample_questions:
    - question: "Which retailers had the highest ROI in Q2 2025?"
    - question: "How does compliance compare across all retail partners?"
tools:
  - tool_spec:
      type: "cortex_analyst_text_to_sql"
      name: "trade_promotions_analyst"
      description: "Answers data questions about Ceres Indonesia trade promotions, spend, ROI, compliance, and lift."
  - tool_spec:
      type: "data_to_chart"
      name: "data_to_chart"
      description: "Generates charts. Use only when explicitly requested."
tool_resources:
  trade_promotions_analyst:
    semantic_view: "CERES_TRADE_PROMO.TRADE_ANALYTICS.CERES_TRADE_PROMOTIONS"
    execution_environment:
      type: "warehouse"
      warehouse: "COMPUTE_WH"
$$;
```

### Step 8: Install & Run the App

```bash
npm install
chmod +x run-dev.sh

# Edit run-dev.sh with your account credentials:
export SNOWFLAKE_ACCOUNT="YOUR_ORG-YOUR_ACCOUNT"
export SNOWFLAKE_USER="YOUR_USER"
export SNOWFLAKE_PRIVATE_KEY_PATH="~/.ssh/rsa_key.p8"

./run-dev.sh
# App runs at http://localhost:3000
```

### Step 9 (Optional): Deploy to SPCS

Run `snowflake/04-spcs-deploy.sql` after pushing the Docker image to your Snowflake image repository.

---

## Customization Guide for Different Products/Markets

To adapt this app for a different product or market:

### Change the product
1. Update `DIM_PPG` in `02-seed-dimensions.sql` — replace Ceres products with your brand
2. Update pricing tiers in `custom_instructions` of the semantic model
3. Update branding in `src/components/app-shell.tsx` (logo, name, subtitle)

### Change the market
1. Update `DIM_RETAILER` in `02-seed-dimensions.sql` — replace Indonesian retailers
2. Update currency formatting in `src/lib/format.ts` (change `id-ID` locale and `IDR` currency)
3. Update column suffixes — rename `_IDR` columns if using a different currency
4. Update `custom_instructions` in the semantic model YAML

### Change the time range
1. Extend/modify `DIM_CALENDAR` in `02-seed-dimensions.sql`
2. Re-seed facts with your desired date coverage
3. Update the `custom_instructions` Q1/Q2 narrative context

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Server-side Snowflake queries (API routes) | Keeps credentials server-only; no client-side SDK exposure |
| 4-path auth chain in `snowflake.ts` | Supports SPCS (OAuth token), PAT, key-pair, and local browser SSO |
| `output: "standalone"` in next.config | Required for Docker/SPCS deployment |
| `snowflake-sdk` in `serverExternalPackages` | Prevents Webpack bundling of native Node modules |
| shadcn/ui + Tailwind 4 | Modern, accessible UI with zero runtime CSS cost |
| Cortex LLM for chat (not OpenAI) | Data stays within Snowflake governance boundary |
| Semantic view + Cortex Agent | For Snowflake Intelligence integration |
| IDR currency throughout | All `_IDR` column suffixes + `Intl.NumberFormat("id-ID")` formatting |

---

## Expected KPIs After Full Setup

| Metric | Value |
|--------|-------|
| Total Promotions | ~2,291 |
| Total Planned Spend | ~Rp 31B |
| Avg Discount Depth | ~22% |
| Q1 2025 ROI | ~0.17× (unprofitable) |
| Q2 2025 ROI | ~1.27× (profitable) |
| Q1 Compliance | ~76% overall, 29% compliant |
| Q2 Compliance | ~88% overall, 73% compliant |
| Retailers | 10 Indonesian chains |
| PPGs | 30 product-pack groups |
| Calendar | W01 2025 – W78 (Jun 2026) |
