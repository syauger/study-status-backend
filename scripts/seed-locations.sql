-- Approximate building coordinates, not entrances or individual study rooms.
-- Match existing names to preserve IDs, coordinates, timestamps, and check-ins.
-- Reruns refresh descriptions, amenities, hours, and noise levels for these five locations only.
-- Feature sources are linked in README.md; wifi means campus network access.
WITH seed_locations (name, latitude, longitude, description, amenities, hours, noise_level) AS (
  VALUES
    ('Clough Undergraduate Learning Commons', 33.7740, -84.3964,
     'Central campus learning commons with group study rooms, Kaldi''s Coffee, and a rooftop garden.',
     'wifi,coffee,outdoor,seating,study rooms',
     '{"monday":"24 hours","tuesday":"24 hours","wednesday":"24 hours","thursday":"24 hours","friday":"24 hours","saturday":"24 hours","sunday":"24 hours","timezone":"America/New_York","notes":"Typical student building access; BuzzCard may be required. Rooftop: weekdays 07:30-18:00, weekends 09:00-17:00. Holidays and breaks may differ."}',
     'conversational'),
    ('Price Gilbert Memorial Library', 33.7744, -84.3955,
     'Campus library with individual and collaborative study spaces, reservable rooms, and a print studio.',
     'wifi,seating,study rooms,printing',
     '{"monday":"24 hours","tuesday":"24 hours","wednesday":"24 hours","thursday":"24 hours","friday":"24 hours","saturday":"24 hours","sunday":"24 hours","timezone":"America/New_York","notes":"Regular-semester student access with BuzzCard; holidays, breaks, and closures may differ. Service desks have separate hours."}',
     'mixed'),
    ('Crosland Tower', 33.7745, -84.3950,
     'Library tower with collaborative study rooms and quiet study areas on the upper floors.',
     'wifi,seating,study rooms,quiet study',
     '{"monday":"24 hours","tuesday":"24 hours","wednesday":"24 hours","thursday":"24 hours","friday":"24 hours","saturday":"24 hours","sunday":"24 hours","timezone":"America/New_York","notes":"Regular-semester student access with BuzzCard; holidays, breaks, and closures may differ. Terrace 07:00-21:00; porch 07:00-19:00 daily."}',
     'mixed'),
    ('John Lewis Student Center', 33.7738, -84.3987,
     'Lively campus gathering place with seating, dining options, and Blue Donkey coffee for study breaks.',
     'wifi,coffee,seating,food',
     '{"monday":"24 hours","tuesday":"24 hours","wednesday":"24 hours","thursday":"24 hours","friday":"24 hours","saturday":"24 hours","sunday":"24 hours","timezone":"America/New_York","notes":"Normal building hours 07:00-23:00 daily; BuzzCard required after hours. Dining and services have separate hours; holiday access may differ."}',
     'lively'),
    ('Kendeda Building', 33.7789, -84.3990,
     'Sustainable campus building with study nooks and outdoor learning areas, including a porch and roof deck.',
     'wifi,outdoor,seating',
     '{"monday":"07:00-22:00","tuesday":"07:00-22:00","wednesday":"07:00-22:00","thursday":"07:00-22:00","friday":"07:00-22:00","saturday":"closed","sunday":"closed","timezone":"America/New_York","notes":"Published spring/fall 2025 schedule; not confirmed for 2026. Closed on Institute holidays. Confirm current access before visiting."}',
     'quiet')
)
INSERT INTO locations (id, name, latitude, longitude, description, amenities, hours, noise_level, created_at)
SELECT existing.id, seed.name, seed.latitude, seed.longitude,
       seed.description, seed.amenities, seed.hours, seed.noise_level, unixepoch()
FROM seed_locations AS seed
LEFT JOIN locations AS existing ON existing.name = seed.name
WHERE true
ON CONFLICT (id) DO UPDATE SET
  description = excluded.description,
  amenities = excluded.amenities,
  hours = excluded.hours,
  noise_level = excluded.noise_level;
