-- Add tee box rating/slope to courses
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS tee_name     text,
  ADD COLUMN IF NOT EXISTS course_rating numeric(4,1),
  ADD COLUMN IF NOT EXISTS slope_rating  integer;

-- Seed values for the 5 trip courses (Championship tees)
UPDATE courses SET tee_name='Championship', course_rating=74.3, slope_rating=141 WHERE slug='rcd';
UPDATE courses SET tee_name='Championship', course_rating=76.0, slope_rating=133 WHERE slug='portrush';
UPDATE courses SET tee_name='Championship', course_rating=74.5, slope_rating=131 WHERE slug='portstewart';
UPDATE courses SET tee_name='Championship', course_rating=72.5, slope_rating=128 WHERE slug='stpats';
UPDATE courses SET tee_name='Championship', course_rating=71.5, slope_rating=125 WHERE slug='otm';
