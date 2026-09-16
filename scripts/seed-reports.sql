-- Apply migrations and seed locations before running this file.
-- Creates 200 reusable sample authors and appends 1,000 reports per location.
-- Reruns retain existing data and append another random batch of reports.
-- Sample authors have no passwords, accounts, or sessions and cannot sign in.
WITH RECURSIVE authors(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM authors WHERE n < 200
)
INSERT INTO user (id, name, email, email_verified, created_at, updated_at)
SELECT
  'seed-report-user-' || n,
  CASE (n - 1) % 10
    WHEN 0 THEN 'Alex' WHEN 1 THEN 'Jordan' WHEN 2 THEN 'Taylor'
    WHEN 3 THEN 'Morgan' WHEN 4 THEN 'Casey' WHEN 5 THEN 'Riley'
    WHEN 6 THEN 'Avery' WHEN 7 THEN 'Quinn' WHEN 8 THEN 'Jamie'
    ELSE 'Cameron'
  END || ' ' || CASE (n - 1) / 10
    WHEN 0 THEN 'Chen' WHEN 1 THEN 'Patel' WHEN 2 THEN 'Kim'
    WHEN 3 THEN 'Garcia' WHEN 4 THEN 'Smith' WHEN 5 THEN 'Nguyen'
    WHEN 6 THEN 'Davis' WHEN 7 THEN 'Wilson' WHEN 8 THEN 'Lee'
    WHEN 9 THEN 'Brown' WHEN 10 THEN 'Shah' WHEN 11 THEN 'Martin'
    WHEN 12 THEN 'Lopez' WHEN 13 THEN 'Thomas' WHEN 14 THEN 'Clark'
    WHEN 15 THEN 'Lewis' WHEN 16 THEN 'Walker' WHEN 17 THEN 'Hall'
    WHEN 18 THEN 'Young' ELSE 'Allen'
  END,
  'seed-report-user-' || n || '@example.invalid',
  0,
  (unixepoch() - 30 * 86400) * 1000,
  (unixepoch() - 30 * 86400) * 1000
FROM authors
WHERE true
ON CONFLICT (id) DO NOTHING;

-- Materialize random choices so each comment agrees with its crowd level.
-- User timestamps above are milliseconds; check-in timestamps are seconds.
WITH RECURSIVE report_numbers(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM report_numbers WHERE n < 1000
), samples AS MATERIALIZED (
  SELECT
    locations.id AS location_id,
    'seed-report-user-' || (1 + abs(random() % 200)) AS created_by,
    abs(random() % 3) AS crowd,
    abs(random() % 5) AS comment_variant,
    unixepoch() - CASE
      WHEN n % 10 = 0 THEN abs(random() % 3600)
      ELSE abs(random() % (7 * 86400))
    END AS created_at
  FROM locations CROSS JOIN report_numbers
)
INSERT INTO checkins (location_id, created_by, crowd_level, comment, created_at)
SELECT
  location_id,
  created_by,
  CASE crowd WHEN 0 THEN 'empty' WHEN 1 THEN 'moderate' ELSE 'busy' END,
  CASE
    WHEN comment_variant = 0 THEN NULL
    WHEN crowd = 0 THEN CASE comment_variant
      WHEN 1 THEN 'Plenty of open seats right now.'
      WHEN 2 THEN 'Almost empty. Easy to find a table.'
      WHEN 3 THEN 'Lots of space to spread out and study.'
      ELSE 'Found a spot immediately.' END
    WHEN crowd = 1 THEN CASE comment_variant
      WHEN 1 THEN 'Some tables are taken, but seats are still available.'
      WHEN 2 THEN 'A steady crowd with a few open tables.'
      WHEN 3 THEN 'Found a seat after a quick look around.'
      ELSE 'About half the seating looks occupied.' END
    ELSE CASE comment_variant
      WHEN 1 THEN 'Most seats are taken. Try another floor.'
      WHEN 2 THEN 'Very crowded at the moment.'
      WHEN 3 THEN 'Had to wait for a table to open up.'
      ELSE 'Hard to find seats together for a group.' END
  END,
  created_at
FROM samples;
