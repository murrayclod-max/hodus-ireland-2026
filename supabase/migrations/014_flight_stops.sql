-- Connections. depart_at already exists but was never surfaced; stops is new,
-- free text so a man can write "via JFK, 2h layover" without a schema debate.
alter table flights add column if not exists stops text;
