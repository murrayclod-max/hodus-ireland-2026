-- Allow nulls for GHIN fields that aren't always returned by the API
-- (e.g. course_rating/slope_rating for informal rounds, differential for non-counting scores)
alter table ghin_recent_rounds
  alter column course_rating drop not null,
  alter column slope_rating  drop not null,
  alter column differential  drop not null;
