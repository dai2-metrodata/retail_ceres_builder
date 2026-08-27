-- ============================================================
-- Ceres Trade Promotions — Fact Table Seed Data
-- Run after 02-seed-dimensions.sql.
-- Generates ~1,760 promotions with matching compliance,
-- lift analysis, and ~17,400 POS actuals records.
-- ============================================================

USE DATABASE CERES_TRADE_PROMO;
USE SCHEMA TRADE_ANALYTICS;
USE WAREHOUSE COMPUTE_WH;

-- ============================================================
-- FACT_TRADE_CALENDAR  (~1,760 promotions)
-- Each retailer-PPG combination gets 4-8 promos across the year.
-- ============================================================
TRUNCATE TABLE IF EXISTS FACT_TRADE_CALENDAR;

INSERT INTO FACT_TRADE_CALENDAR (
  RETAILER_ID, PPG_ID, WEEK_START, WEEK_END,
  DISCOUNT_IDR, DISCOUNT_PCT, PROMO_TYPE,
  PLANNED_SPEND_IDR, PLANNED_VOLUME_CASES,
  COVERAGE, PLANNED_HAS_DISPLAY, PLANNED_HAS_FEATURE, STATUS
)
WITH promo_slots AS (
  -- Generate ~6 promo slots per retailer-PPG by picking random weeks
  SELECT
    r.RETAILER_ID,
    p.PPG_ID,
    c.WEEK_START,
    -- Some promos span 2 weeks (30% chance)
    CASE WHEN UNIFORM(1, 10, RANDOM()) <= 3
         THEN DATEADD('week', 1, c.WEEK_START)
         ELSE c.WEEK_START
    END AS WEEK_END,
    p.REGULAR_PRICE_IDR,
    r.COVERAGE_TYPE,
    -- Random discount between 10-35%
    UNIFORM(10, 35, RANDOM()) AS DISC_PCT,
    -- Random promo type weighted: TPR most common, TPR+D+F rarest
    CASE UNIFORM(1, 20, RANDOM())
      WHEN 1  THEN 'TPR+D+F'
      WHEN 2  THEN 'TPR+D+F'
      WHEN 3  THEN 'TPR+F'
      WHEN 4  THEN 'TPR+F'
      WHEN 5  THEN 'TPR+F'
      WHEN 6  THEN 'TPR+F'
      WHEN 7  THEN 'TPR+F'
      WHEN 8  THEN 'TPR+D'
      WHEN 9  THEN 'TPR+D'
      WHEN 10 THEN 'TPR+D'
      WHEN 11 THEN 'TPR+D'
      WHEN 12 THEN 'TPR+D'
      WHEN 13 THEN 'TPR+D'
      WHEN 14 THEN 'TPR+D'
      WHEN 15 THEN 'TPR+D'
      ELSE 'TPR'
    END AS PROMO_TYPE
  FROM DIM_RETAILER r
  CROSS JOIN DIM_PPG p
  CROSS JOIN DIM_CALENDAR c
  -- Each retailer-PPG-week has a ~10% chance of having a promo
  WHERE UNIFORM(1, 100, RANDOM()) <= 10
)
SELECT
  RETAILER_ID,
  PPG_ID,
  WEEK_START,
  WEEK_END,
  -- Discount IDR = regular price * discount %
  ROUND(REGULAR_PRICE_IDR * DISC_PCT / 100, 0)           AS DISCOUNT_IDR,
  DISC_PCT                                                 AS DISCOUNT_PCT,
  PROMO_TYPE,
  -- Planned spend: 1,000,000-150,000,000 IDR depending on store count and pack size
  ROUND(UNIFORM(1000000, 150000000, RANDOM()) * (DISC_PCT / 20.0), 0) AS PLANNED_SPEND_IDR,
  -- Planned volume: 200-5000 cases
  UNIFORM(200, 5000, RANDOM())                             AS PLANNED_VOLUME_CASES,
  -- Coverage based on retailer's coverage type
  COVERAGE_TYPE                                            AS COVERAGE,
  -- Display flag: TRUE for TPR+D and TPR+D+F
  PROMO_TYPE IN ('TPR+D', 'TPR+D+F')                      AS PLANNED_HAS_DISPLAY,
  -- Feature flag: TRUE for TPR+F and TPR+D+F
  PROMO_TYPE IN ('TPR+F', 'TPR+D+F')                      AS PLANNED_HAS_FEATURE,
  'COMPLETED'                                              AS STATUS
FROM promo_slots;

-- ============================================================
-- FACT_COMPLIANCE_SCORES  (one per promo)
-- Generates compliance scores with realistic distributions.
-- ============================================================
TRUNCATE TABLE IF EXISTS FACT_COMPLIANCE_SCORES;

INSERT INTO FACT_COMPLIANCE_SCORES (
  PROMO_ID,
  PRICE_ACCURACY_PCT,
  DISPLAY_COMPLIANCE_PCT,
  FEATURE_COMPLIANCE_PCT,
  OVERALL_COMPLIANCE_PCT,
  COMPLIANCE_STATUS
)
SELECT
  tc.PROMO_ID,
  -- Price accuracy: 0-100, skewed toward higher values
  ROUND(GREATEST(0, LEAST(100, 50 + UNIFORM(-50, 50, RANDOM()) + UNIFORM(0, 30, RANDOM()))), 1) AS PRICE_ACC,
  -- Display compliance: 100 if no display planned, else 0-100
  CASE WHEN tc.PLANNED_HAS_DISPLAY
       THEN ROUND(GREATEST(0, LEAST(100, UNIFORM(20, 100, RANDOM()))), 1)
       ELSE 100.0
  END AS DISPLAY_COMP,
  -- Feature compliance: 100 if no feature planned, else 0-100
  CASE WHEN tc.PLANNED_HAS_FEATURE
       THEN ROUND(GREATEST(0, LEAST(100, UNIFORM(15, 100, RANDOM()))), 1)
       ELSE 100.0
  END AS FEATURE_COMP,
  0 AS OVERALL_PLACEHOLDER,  -- computed below
  '' AS STATUS_PLACEHOLDER    -- computed below
FROM FACT_TRADE_CALENDAR tc;

-- Update overall score and status based on component scores
UPDATE FACT_COMPLIANCE_SCORES
SET OVERALL_COMPLIANCE_PCT = ROUND(
      (PRICE_ACCURACY_PCT + DISPLAY_COMPLIANCE_PCT + FEATURE_COMPLIANCE_PCT) / 3, 1
    ),
    COMPLIANCE_STATUS = CASE
      WHEN (PRICE_ACCURACY_PCT + DISPLAY_COMPLIANCE_PCT + FEATURE_COMPLIANCE_PCT) / 3 >= 85 THEN 'COMPLIANT'
      WHEN (PRICE_ACCURACY_PCT + DISPLAY_COMPLIANCE_PCT + FEATURE_COMPLIANCE_PCT) / 3 >= 60 THEN 'PARTIAL'
      ELSE 'NON-COMPLIANT'
    END;

-- ============================================================
-- FACT_LIFT_ANALYSIS  (one per promo)
-- Generates lift metrics: base volume, incremental, ROI.
-- ============================================================
TRUNCATE TABLE IF EXISTS FACT_LIFT_ANALYSIS;

INSERT INTO FACT_LIFT_ANALYSIS (
  PROMO_ID,
  BASE_VOLUME_CASES,
  INCREMENTAL_VOLUME_CASES,
  TOTAL_PROMOTED_VOLUME_CASES,
  LIFT_PCT,
  SPEND_IDR,
  INCREMENTAL_REVENUE_IDR,
  ROI
)
SELECT
  tc.PROMO_ID,
  -- Base volume: 200-1200 cases
  UNIFORM(200, 1200, RANDOM()) AS BASE_VOL,
  -- Incremental volume scales with discount and promo type
  GREATEST(50, ROUND(UNIFORM(200, 1200, RANDOM()) *
    (tc.DISCOUNT_PCT / 20.0) *
    CASE tc.PROMO_TYPE
      WHEN 'TPR'     THEN 0.5
      WHEN 'TPR+D'   THEN 0.7
      WHEN 'TPR+F'   THEN 0.65
      WHEN 'TPR+D+F' THEN 0.9
      ELSE 0.5
    END
  )) AS INCR_VOL,
  0 AS TOTAL_PLACEHOLDER,
  0 AS LIFT_PLACEHOLDER,
  -- Spend: use the planned spend with some variance
  ROUND(tc.PLANNED_SPEND_IDR * UNIFORM(50, 150, RANDOM()) / 100, 0) AS SPEND,
  0 AS REV_PLACEHOLDER,
  0 AS ROI_PLACEHOLDER
FROM FACT_TRADE_CALENDAR tc;

-- Compute derived columns
UPDATE FACT_LIFT_ANALYSIS
SET TOTAL_PROMOTED_VOLUME_CASES = BASE_VOLUME_CASES + INCREMENTAL_VOLUME_CASES,
    LIFT_PCT = ROUND(INCREMENTAL_VOLUME_CASES * 100.0 / NULLIF(BASE_VOLUME_CASES, 0), 1),
    INCREMENTAL_REVENUE_IDR = ROUND(INCREMENTAL_VOLUME_CASES * UNIFORM(5000, 50000, RANDOM()), 0),
    ROI = ROUND(
      (INCREMENTAL_VOLUME_CASES * UNIFORM(5000, 50000, RANDOM())) / NULLIF(SPEND_IDR, 0),
      2
    );

-- ============================================================
-- FACT_POS_ACTUALS  (~10 records per retailer-PPG combo)
-- Point-of-sale weekly data across all weeks.
-- ============================================================
TRUNCATE TABLE IF EXISTS FACT_POS_ACTUALS;

INSERT INTO FACT_POS_ACTUALS (
  RETAILER_ID, PPG_ID, WEEK_ID,
  ACTUAL_PRICE_IDR, ACTUAL_VOLUME_CASES, BASE_VOLUME_CASES,
  IS_ON_FEATURE, IS_ON_DISPLAY, IS_PROMOTED
)
SELECT
  r.RETAILER_ID,
  p.PPG_ID,
  c.WEEK_ID,
  -- Actual price: regular price minus random discount (0-35%)
  ROUND(p.REGULAR_PRICE_IDR * (1 - UNIFORM(0, 35, RANDOM()) / 100.0), 0) AS ACTUAL_PRICE,
  -- Actual volume: 100-900 cases
  UNIFORM(100, 900, RANDOM()) AS ACTUAL_VOL,
  -- Base volume: 60-80% of actual volume
  ROUND(UNIFORM(100, 900, RANDOM()) * UNIFORM(40, 80, RANDOM()) / 100.0) AS BASE_VOL,
  -- Feature flag: ~15% of weeks
  UNIFORM(1, 100, RANDOM()) <= 15 AS IS_ON_FEATURE,
  -- Display flag: ~20% of weeks
  UNIFORM(1, 100, RANDOM()) <= 20 AS IS_ON_DISPLAY,
  -- Promoted flag: ~40% of weeks
  UNIFORM(1, 100, RANDOM()) <= 40 AS IS_PROMOTED
FROM DIM_RETAILER r
CROSS JOIN DIM_PPG p
CROSS JOIN DIM_CALENDAR c
-- ~29 records per retailer-PPG across 60 weeks (~48% hit rate)
WHERE UNIFORM(1, 100, RANDOM()) <= 48;

-- ============================================================
-- FACT_OPTIMIZATION_SCENARIOS  (starts empty — populated via app)
-- ============================================================
TRUNCATE TABLE IF EXISTS FACT_OPTIMIZATION_SCENARIOS;

-- ============================================================
-- Verification queries
-- ============================================================
SELECT 'FACT_TRADE_CALENDAR'    AS TABLE_NAME, COUNT(*) AS ROW_COUNT FROM FACT_TRADE_CALENDAR
UNION ALL
SELECT 'FACT_COMPLIANCE_SCORES' AS TABLE_NAME, COUNT(*) AS ROW_COUNT FROM FACT_COMPLIANCE_SCORES
UNION ALL
SELECT 'FACT_LIFT_ANALYSIS'     AS TABLE_NAME, COUNT(*) AS ROW_COUNT FROM FACT_LIFT_ANALYSIS
UNION ALL
SELECT 'FACT_POS_ACTUALS'       AS TABLE_NAME, COUNT(*) AS ROW_COUNT FROM FACT_POS_ACTUALS
UNION ALL
SELECT 'FACT_OPT_SCENARIOS'     AS TABLE_NAME, COUNT(*) AS ROW_COUNT FROM FACT_OPTIMIZATION_SCENARIOS;

-- Done. Run 04-spcs-deploy.sql to deploy the app container.
