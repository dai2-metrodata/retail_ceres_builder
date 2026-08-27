-- ============================================================
-- SnowBolt Energy Indonesia Trade Promotions — Dimension Seed Data
-- Run after 01-setup.sql to populate the three dimension tables.
-- ============================================================

USE DATABASE CERES_TRADE_PROMO;
USE SCHEMA TRADE_ANALYTICS;
USE WAREHOUSE COMPUTE_WH;

-- ============================================================
-- DIM_RETAILER  (10 Indonesian retailers)
-- ============================================================
TRUNCATE TABLE IF EXISTS DIM_RETAILER;

INSERT INTO DIM_RETAILER (RETAILER_ID, RETAILER_NAME, COUNTRY, CHANNEL, COVERAGE_TYPE, STORE_COUNT) VALUES
  (1,  'Indomaret',            'Indonesia', 'Minimarket',   'National',  21000),
  (2,  'Alfamart',             'Indonesia', 'Minimarket',   'National',  17000),
  (3,  'Hypermart',            'Indonesia', 'Hypermarket',  'National',    120),
  (4,  'Giant',                'Indonesia', 'Supermarket',  'National',     60),
  (5,  'Carrefour Indonesia',  'Indonesia', 'Hypermarket',  'National',     30),
  (6,  'Superindo',            'Indonesia', 'Supermarket',  'Regional',    190),
  (7,  'Lotte Mart',           'Indonesia', 'Hypermarket',  'Regional',     48),
  (8,  'Transmart',            'Indonesia', 'Hypermarket',  'National',     70),
  (9,  'AEON',                 'Indonesia', 'Supermarket',  'Regional',     35),
  (10, 'Ranch Market',         'Indonesia', 'Supermarket',  'Regional',     18);

-- ============================================================
-- DIM_PPG  (30 Price-Pack Groups)
-- ============================================================
TRUNCATE TABLE IF EXISTS DIM_PPG;


INSERT INTO DIM_PPG (PPG_ID, PPG_NAME, PACK_SIZE, PRODUCT_VARIANT, REGULAR_PRICE_IDR, CATEGORY, IS_LIMITED_EDITION) VALUES
('PPG001', 'Ceres Meses Milk Choco 40g',        '40g',   'Milk Chocolate',      6500,  'Chocolate Sprinkles', FALSE),
('PPG002', 'Ceres Meses Milk Choco 80g',        '80g',   'Milk Chocolate',      12000, 'Chocolate Sprinkles', FALSE),
('PPG003', 'Ceres Meses Milk Choco 200g',       '200g',  'Milk Chocolate',      26500, 'Chocolate Sprinkles', FALSE),
('PPG004', 'Ceres Meses Milk Choco 400g',       '400g',  'Milk Chocolate',      48000, 'Chocolate Sprinkles', FALSE),
('PPG005', 'Ceres Meses Milk Choco 1kg',        '1kg',   'Milk Chocolate',      98000, 'Chocolate Sprinkles', FALSE),
('PPG006', 'Ceres Meses Dark Choco 40g',        '40g',   'Dark Chocolate',      7000,  'Chocolate Sprinkles', FALSE),
('PPG007', 'Ceres Meses Dark Choco 80g',        '80g',   'Dark Chocolate',      13000, 'Chocolate Sprinkles', FALSE),
('PPG008', 'Ceres Meses Dark Choco 200g',       '200g',  'Dark Chocolate',      28500, 'Chocolate Sprinkles', FALSE),
('PPG009', 'Ceres Meses Dark Choco 400g',       '400g',  'Dark Chocolate',      52000, 'Chocolate Sprinkles', FALSE),
('PPG010', 'Ceres Meses Dark Choco 1kg',        '1kg',   'Dark Chocolate',      105000,'Chocolate Sprinkles', FALSE),
('PPG011', 'Ceres Meses White Choco 40g',       '40g',   'White Chocolate',     7000,  'Chocolate Sprinkles', FALSE),
('PPG012', 'Ceres Meses White Choco 80g',       '80g',   'White Chocolate',     13500, 'Chocolate Sprinkles', FALSE),
('PPG013', 'Ceres Meses White Choco 200g',      '200g',  'White Chocolate',     29000, 'Chocolate Sprinkles', FALSE),
('PPG014', 'Ceres Meses White Choco 400g',      '400g',  'White Chocolate',     53500, 'Chocolate Sprinkles', FALSE),
('PPG015', 'Ceres Meses Rainbow 40g',           '40g',   'Rainbow Mix',         7500,  'Chocolate Sprinkles', FALSE),
('PPG016', 'Ceres Meses Rainbow 80g',           '80g',   'Rainbow Mix',         14000, 'Chocolate Sprinkles', FALSE),
('PPG017', 'Ceres Meses Rainbow 200g',          '200g',  'Rainbow Mix',         30500, 'Chocolate Sprinkles', FALSE),
('PPG018', 'Ceres Meses Tiramisu 40g',          '40g',   'Tiramisu',            8000,  'Chocolate Sprinkles', TRUE),
('PPG019', 'Ceres Meses Tiramisu 80g',          '80g',   'Tiramisu',            15000, 'Chocolate Sprinkles', TRUE),
('PPG020', 'Ceres Meses Matcha 40g',            '40g',   'Matcha',              8500,  'Chocolate Sprinkles', TRUE),
('PPG021', 'Ceres Meses Matcha 80g',            '80g',   'Matcha',              16000, 'Chocolate Sprinkles', TRUE),
('PPG022', 'Ceres Meses Strawberry 40g',        '40g',   'Strawberry',          7500,  'Chocolate Sprinkles', FALSE),
('PPG023', 'Ceres Meses Strawberry 80g',        '80g',   'Strawberry',          14500, 'Chocolate Sprinkles', FALSE),
('PPG024', 'Ceres Meses Mini Sachet 20g',       '20g',   'Milk Chocolate',      3500,  'Chocolate Sprinkles', FALSE),
('PPG025', 'Ceres Meses Mini Sachet Dark 20g',  '20g',   'Dark Chocolate',      4000,  'Chocolate Sprinkles', FALSE),
('PPG026', 'Ceres Meses Family Pack 2kg',       '2kg',   'Milk Chocolate',      185000,'Chocolate Sprinkles', FALSE),
('PPG027', 'Ceres Meses Family Pack Dark 2kg',  '2kg',   'Dark Chocolate',      198000,'Chocolate Sprinkles', FALSE),
('PPG028', 'Ceres Meses Ramadan Edition 200g',  '200g',  'Milk Chocolate',      27500, 'Chocolate Sprinkles', TRUE),
('PPG029', 'Ceres Meses Lebaran Gift Box 400g', '400g',  'Assorted',            65000, 'Chocolate Sprinkles', TRUE),
('PPG030', 'Ceres Meses Christmas Edition 200g','200g',  'Milk Chocolate',      29500, 'Chocolate Sprinkles', TRUE);

-- ============================================================
-- DIM_CALENDAR  (60 weeks: W01-W52 of 2025 + W53-W60 into 2026 Q1)
-- ============================================================
TRUNCATE TABLE IF EXISTS DIM_CALENDAR;

INSERT INTO DIM_CALENDAR (WEEK_ID, WEEK_START, WEEK_END, YEAR, QUARTER, MONTH, PERIOD_NAME) VALUES
  (1,  '2025-01-06', '2025-01-12', 2025, 1,  1, 'W01'),
  (2,  '2025-01-13', '2025-01-19', 2025, 1,  1, 'W02'),
  (3,  '2025-01-20', '2025-01-26', 2025, 1,  1, 'W03'),
  (4,  '2025-01-27', '2025-02-02', 2025, 1,  1, 'W04'),
  (5,  '2025-02-03', '2025-02-09', 2025, 1,  2, 'W05'),
  (6,  '2025-02-10', '2025-02-16', 2025, 1,  2, 'W06'),
  (7,  '2025-02-17', '2025-02-23', 2025, 1,  2, 'W07'),
  (8,  '2025-02-24', '2025-03-02', 2025, 1,  2, 'W08'),
  (9,  '2025-03-03', '2025-03-09', 2025, 1,  3, 'W09'),
  (10, '2025-03-10', '2025-03-16', 2025, 1,  3, 'W10'),
  (11, '2025-03-17', '2025-03-23', 2025, 1,  3, 'W11'),
  (12, '2025-03-24', '2025-03-30', 2025, 1,  3, 'W12'),
  (13, '2025-03-31', '2025-04-06', 2025, 1,  3, 'W13'),
  (14, '2025-04-07', '2025-04-13', 2025, 2,  4, 'W14'),
  (15, '2025-04-14', '2025-04-20', 2025, 2,  4, 'W15'),
  (16, '2025-04-21', '2025-04-27', 2025, 2,  4, 'W16'),
  (17, '2025-04-28', '2025-05-04', 2025, 2,  4, 'W17'),
  (18, '2025-05-05', '2025-05-11', 2025, 2,  5, 'W18'),
  (19, '2025-05-12', '2025-05-18', 2025, 2,  5, 'W19'),
  (20, '2025-05-19', '2025-05-25', 2025, 2,  5, 'W20'),
  (21, '2025-05-26', '2025-06-01', 2025, 2,  5, 'W21'),
  (22, '2025-06-02', '2025-06-08', 2025, 2,  6, 'W22'),
  (23, '2025-06-09', '2025-06-15', 2025, 2,  6, 'W23'),
  (24, '2025-06-16', '2025-06-22', 2025, 2,  6, 'W24'),
  (25, '2025-06-23', '2025-06-29', 2025, 2,  6, 'W25'),
  (26, '2025-06-30', '2025-07-06', 2025, 2,  6, 'W26'),
  (27, '2025-07-07', '2025-07-13', 2025, 3,  7, 'W27'),
  (28, '2025-07-14', '2025-07-20', 2025, 3,  7, 'W28'),
  (29, '2025-07-21', '2025-07-27', 2025, 3,  7, 'W29'),
  (30, '2025-07-28', '2025-08-03', 2025, 3,  7, 'W30'),
  (31, '2025-08-04', '2025-08-10', 2025, 3,  8, 'W31'),
  (32, '2025-08-11', '2025-08-17', 2025, 3,  8, 'W32'),
  (33, '2025-08-18', '2025-08-24', 2025, 3,  8, 'W33'),
  (34, '2025-08-25', '2025-08-31', 2025, 3,  8, 'W34'),
  (35, '2025-09-01', '2025-09-07', 2025, 3,  9, 'W35'),
  (36, '2025-09-08', '2025-09-14', 2025, 3,  9, 'W36'),
  (37, '2025-09-15', '2025-09-21', 2025, 3,  9, 'W37'),
  (38, '2025-09-22', '2025-09-28', 2025, 3,  9, 'W38'),
  (39, '2025-09-29', '2025-10-05', 2025, 3,  9, 'W39'),
  (40, '2025-10-06', '2025-10-12', 2025, 4, 10, 'W40'),
  (41, '2025-10-13', '2025-10-19', 2025, 4, 10, 'W41'),
  (42, '2025-10-20', '2025-10-26', 2025, 4, 10, 'W42'),
  (43, '2025-10-27', '2025-11-02', 2025, 4, 10, 'W43'),
  (44, '2025-11-03', '2025-11-09', 2025, 4, 11, 'W44'),
  (45, '2025-11-10', '2025-11-16', 2025, 4, 11, 'W45'),
  (46, '2025-11-17', '2025-11-23', 2025, 4, 11, 'W46'),
  (47, '2025-11-24', '2025-11-30', 2025, 4, 11, 'W47'),
  (48, '2025-12-01', '2025-12-07', 2025, 4, 12, 'W48'),
  (49, '2025-12-08', '2025-12-14', 2025, 4, 12, 'W49'),
  (50, '2025-12-15', '2025-12-21', 2025, 4, 12, 'W50'),
  (51, '2025-12-22', '2025-12-28', 2025, 4, 12, 'W51'),
  (52, '2025-12-29', '2026-01-04', 2025, 4, 12, 'W52'),
  (53, '2026-01-05', '2026-01-11', 2026, 1,  1, 'W53'),
  (54, '2026-01-12', '2026-01-18', 2026, 1,  1, 'W54'),
  (55, '2026-01-19', '2026-01-25', 2026, 1,  1, 'W55'),
  (56, '2026-01-26', '2026-02-01', 2026, 1,  1, 'W56'),
  (57, '2026-02-02', '2026-02-08', 2026, 1,  2, 'W57'),
  (58, '2026-02-09', '2026-02-15', 2026, 1,  2, 'W58'),
  (59, '2026-02-16', '2026-02-22', 2026, 1,  2, 'W59'),
  (60, '2026-02-23', '2026-03-01', 2026, 1,  2, 'W60');

-- Done. Run 03-seed-facts.sql next.
