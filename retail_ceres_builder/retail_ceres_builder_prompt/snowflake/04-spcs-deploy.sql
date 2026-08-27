-- ============================================================
-- SnowBolt Energy EMEA Trade Promotions — SPCS Deployment
-- Run after the data is seeded (01→02→03) and the Docker
-- image has been pushed to the Snowflake image registry.
-- ============================================================

USE DATABASE CERES_TRADE_PROMO;
USE SCHEMA TRADE_ANALYTICS;
USE WAREHOUSE COMPUTE_WH;

-- ============================================================
-- 1. Image Repository
-- ============================================================
CREATE IMAGE REPOSITORY IF NOT EXISTS IMAGE_REPO;

-- Show the repository URL — you'll need it for `docker tag` / `docker push`.
SHOW IMAGE REPOSITORIES LIKE 'IMAGE_REPO';
-- Copy the "repository_url" value from the output, e.g.:
--   <account>.registry.snowflakecomputing.com/ceres_trade_promo/trade_analytics/image_repo
-- docker login "repository_url" at local
--docker login nynkybm-ij81701.registry.snowflakecomputing.com -u RINNOBAGUS
-- ensure your docker desktop service is active before build image
-- docker build -t "repository_url" at local
--docker build -t nynkybm-ij81701.registry.snowflakecomputing.com/ceres_trade_promo/trade_analytics/image_repo/retail_ceres:latest .
-- docker push "repository_url" at local
--docker push nynkybm-ij81701.registry.snowflakecomputing.com/ceres_trade_promo/trade_analytics/image_repo/retail_ceres:latest


-- ============================================================
-- 2. Compute Pool
-- ============================================================
CREATE COMPUTE POOL IF NOT EXISTS TRADE_PROMO_POOL
  MIN_NODES = 1
  MAX_NODES = 1
  INSTANCE_FAMILY = CPU_X64_XS
  AUTO_RESUME = TRUE
  AUTO_SUSPEND_SECS = 300;

-- Wait until the pool is ACTIVE before creating the service:
DESCRIBE COMPUTE POOL TRADE_PROMO_POOL;

-- ============================================================
-- 3. Create the Service
--    This uses an inline specification. Make sure the Docker
--    image has been pushed to IMAGE_REPO first.
-- ============================================================
DROP SERVICE IF EXISTS TRADE_PROMO_APP;

CREATE SERVICE TRADE_PROMO_APP
  IN COMPUTE POOL TRADE_PROMO_POOL
  FROM SPECIFICATION $$
spec:
  containers:
    - name: ceres-trade-promo
      image: /CERES_TRADE_PROMO/TRADE_ANALYTICS/IMAGE_REPO/retail_ceres:latest
      env:
        SNOWFLAKE_WAREHOUSE: COMPUTE_WH
        SNOWFLAKE_DATABASE: CERES_TRADE_PROMO
        SNOWFLAKE_SCHEMA: TRADE_ANALYTICS
      resources:
        requests:
          cpu: 0.5
          memory: 1Gi
        limits:
          cpu: 2
          memory: 4Gi
  endpoints:
    - name: app
      port: 8000
      public: true
$$
  QUERY_WAREHOUSE = 'COMPUTE_WH'
  MIN_INSTANCES = 1
  MAX_INSTANCES = 1;

-- ============================================================
-- 4. Verify
-- ============================================================

-- Check the container is READY:
SELECT SYSTEM$GET_SERVICE_STATUS('TRADE_PROMO_APP');

-- Get the public endpoint URL (may take 1-2 minutes to provision):
SHOW ENDPOINTS IN SERVICE TRADE_PROMO_APP;

-- ============================================================
-- Useful management commands
-- ============================================================
-- View logs:        SELECT SYSTEM$GET_SERVICE_LOGS('TRADE_PROMO_APP', 0, 'ceres-trade-promo', 100);
-- Suspend service:  ALTER SERVICE TRADE_PROMO_APP SUSPEND;
-- Resume service:   ALTER SERVICE TRADE_PROMO_APP RESUME;
-- Drop service:     DROP SERVICE TRADE_PROMO_APP;
-- Drop pool:        DROP COMPUTE POOL TRADE_PROMO_POOL;
