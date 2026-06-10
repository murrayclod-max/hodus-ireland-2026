-- Add Irish first name to each lass
alter table lass_of_the_day add column if not exists name text;
