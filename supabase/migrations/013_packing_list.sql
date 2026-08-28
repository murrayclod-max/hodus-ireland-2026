-- Packing list: one shared, member-editable checklist.
-- The list itself (categories + items) is shared — anyone on the trip can add,
-- rename, or delete. The tick marks are per-player, so each man packs his own bag.

create table if not exists packing_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists packing_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references packing_categories(id) on delete cascade,
  label text not null,
  note text,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists packing_items_category_idx on packing_items(category_id);

create table if not exists packing_checks (
  player_id uuid not null references players(id) on delete cascade,
  item_id uuid not null references packing_items(id) on delete cascade,
  checked_at timestamptz not null default now(),
  primary key (player_id, item_id)
);

-- ── RLS ───────────────────────────────────────────────────────────
alter table packing_categories enable row level security;
alter table packing_items      enable row level security;
alter table packing_checks     enable row level security;

drop policy if exists "members can manage packing_categories" on packing_categories;
create policy "members can manage packing_categories" on packing_categories
  for all using (is_trip_member()) with check (is_trip_member());

drop policy if exists "members can manage packing_items" on packing_items;
create policy "members can manage packing_items" on packing_items
  for all using (is_trip_member()) with check (is_trip_member());

-- Ticks are private to each player
drop policy if exists "player can manage own packing_checks" on packing_checks;
create policy "player can manage own packing_checks" on packing_checks
  for all using (player_id = my_player_id()) with check (player_id = my_player_id());

-- ── Seed (only when the list is empty) ────────────────────────────
do $$
declare
  cat_id uuid;
begin
  if exists (select 1 from packing_categories) then
    return;
  end if;

  insert into packing_categories (name, emoji, sort) values
    ('Documents & Money',    '🛂', 1),
    ('Golf Gear',            '⛳', 2),
    ('Golf Clothes',         '👕', 3),
    ('Everyday Clothes',     '🧥', 4),
    ('Electronics',          '🔌', 5),
    ('Toiletries & First Aid','🧴', 6),
    ('Travel Extras',        '🧳', 7);

  select id into cat_id from packing_categories where name = 'Documents & Money';
  insert into packing_items (category_id, label, note, sort) values
    (cat_id, 'Passport',              null,                              1),
    (cat_id, 'Wallet',                'credit cards, driver''s license', 2),
    (cat_id, 'Tip money',             'euros',                           3),
    (cat_id, 'UK ETA approval',       'needed for Northern Ireland — £20, get it before you fly', 4),
    (cat_id, '£300 cash',             'County Down £75, Portrush £80, Portstewart £70 — each plus a 25–35% tip', 5),
    (cat_id, '€500 cash',             'Rosapenna caddies €90 a round, plus €15–20 per day for the driver', 6),
    (cat_id, 'Guinness Storehouse ticket', 'Fri 9/11, 2:45pm — ref 904474457', 7),
    (cat_id, 'Travel insurance card', null,                              8),
    (cat_id, 'Photo of passport page', 'on your phone, in case the real one walks', 9),
    (cat_id, 'Tell your bank you''re travelling', 'or your card gets frozen at Dublin arrivals', 10),
    (cat_id, 'Proof of handicap',      'you''ll probably never be asked — but just in case', 11);

  select id into cat_id from packing_categories where name = 'Golf Gear';
  insert into packing_items (category_id, label, note, sort) values
    (cat_id, 'Clubs',              'leave the 64° wedge and the junk in the bottom of the bag at home', 1),
    (cat_id, 'Balls',              'lots of them — far cheaper here than there; pack them in your suitcase, not the golf bag', 2),
    (cat_id, 'Gloves',             null, 3),
    (cat_id, 'Rain gloves',        null, 4),
    (cat_id, '2 pairs golf shoes', 'in your suitcase too, in case the clubs go astray', 5),
    (cat_id, 'Goretex rain suit',  null, 6),
    (cat_id, 'Hat',                null, 7),
    (cat_id, 'Knit cap',           null, 8),
    (cat_id, 'Sunglasses',         null, 9),
    (cat_id, 'Flask',              null, 10),
    (cat_id, 'Travel bag for clubs', 'hard case or Club Glove — 6 flights of baggage handlers', 11),
    (cat_id, 'Tees & ball markers', null, 12),
    (cat_id, 'Divot tool',         null, 13),
    (cat_id, '2 golf towels',      'one stays dry in the bag', 14),
    (cat_id, 'Rain hood for the bag', null, 15),
    (cat_id, 'Spike wrench & spare spikes', null, 16),
    (cat_id, 'Sharpie',            null, 17),
    (cat_id, 'Hand warmers',       null, 18),
    (cat_id, 'Lightweight carry bag', 'for any round where the caddies run short', 19);

  select id into cat_id from packing_categories where name = 'Golf Clothes';
  insert into packing_items (category_id, label, note, sort) values
    (cat_id, '6 golf shirts',            null, 1),
    (cat_id, '2 longsleeve undershirts', null, 2),
    (cat_id, '3 long pants for golf',    null, 3),
    (cat_id, '2 golf shorts',            null, 4),
    (cat_id, '8 pairs golf socks',       'knee-length or sports socks if you plan to wear shorts', 5),
    (cat_id, '2 compression shorts',     null, 6),
    (cat_id, 'Wind vest',                null, 7),
    (cat_id, '2 quarter-zips / sweaters', 'merino beats cotton when it''s wet', 8),
    (cat_id, 'Thermal base layer bottoms', 'for a cold morning at County Down', 9),
    (cat_id, 'Waterproof trousers',      'if the Goretex suit is jacket-only', 10),
    (cat_id, 'Spare belt for golf',      null, 11),
    (cat_id, 'Waterproof / bucket hat',  null, 12);

  select id into cat_id from packing_categories where name = 'Everyday Clothes';
  insert into packing_items (category_id, label, note, sort) values
    (cat_id, '4 tee shirts',                  null, 1),
    (cat_id, '2 button-down going out shirts', null, 2),
    (cat_id, '1 pair jeans',                  null, 3),
    (cat_id, 'Puffy jacket',                  null, 4),
    (cat_id, 'Running shoes',                 null, 5),
    (cat_id, '10 underwear',                  null, 6),
    (cat_id, '1 belt',                        null, 7),
    (cat_id, 'Sweater or quarter-zip for dinners', 'Vardon, White Pheasant, Villa Vinci', 8),
    (cat_id, 'Swim trunks',                   'Slieve Donard spa', 9),
    (cat_id, 'Sleepwear',                     null, 10),
    (cat_id, 'Travel day outfit home',        'kept clean and separate', 11),
    (cat_id, 'Laundry bag',                   'nine days of wet golf clothes', 12);

  select id into cat_id from packing_categories where name = 'Electronics';
  insert into packing_items (category_id, label, note, sort) values
    (cat_id, 'Charger',       null,                          1),
    (cat_id, 'Plug adapters', 'Type G',                      2),
    (cat_id, 'Computer',      null,                          3),
    (cat_id, 'AirPods',       null,                          4),
    (cat_id, 'Watch',         null,                          5),
    (cat_id, 'Boom box',      'Todd has one he will bring',  6),
    (cat_id, 'Battery pack',  'long days, no outlets on the coach', 7),
    (cat_id, 'Extra charging cables', null,                  8),
    (cat_id, 'Watch charger', null,                          9),
    (cat_id, 'Multi-port USB brick', 'one adapter charges everything', 10);

  select id into cat_id from packing_categories where name = 'Toiletries & First Aid';
  insert into packing_items (category_id, label, note, sort) values
    (cat_id, 'Dopp kit',        null,                    1),
    (cat_id, 'Backup glasses',  null,                    2),
    (cat_id, 'Sunscreen',       null,                    3),
    (cat_id, 'Advil',           null,                    4),
    (cat_id, 'Moleskin',        null,                    5),
    (cat_id, 'Sports Glide',    'for the undercarriage', 6),
    (cat_id, 'Prescription meds', 'full trip plus a few spare days', 7),
    (cat_id, 'Blister plasters',  'Compeed — 6 rounds of walking links', 8),
    (cat_id, 'Band-aids & athletic tape', null,          9),
    (cat_id, 'Voltaren / muscle rub', null,              10),
    (cat_id, 'Lip balm with SPF', null,                  11),
    (cat_id, 'Antacid',           null,                  12),
    (cat_id, 'Melatonin or sleep aid', 'the overnight flight over', 13),
    (cat_id, 'Eye mask & earplugs', 'twin rooms, snoring roommates', 14),
    (cat_id, 'Electrolyte packets', 'the morning after Dublin', 15),
    (cat_id, 'Contacts & solution', null,                16),
    (cat_id, 'Nail clippers',     null,                  17);

  select id into cat_id from packing_categories where name = 'Travel Extras';
  insert into packing_items (category_id, label, note, sort) values
    (cat_id, 'Luggage tags & TSA locks',   null,                              1),
    (cat_id, 'AirTag in the golf bag',     'so you know where the clubs are', 2),
    (cat_id, 'Neck pillow',                null,                              3),
    (cat_id, 'Packing cubes',              null,                              4),
    (cat_id, 'Reusable water bottle',      'empty through security',          5),
    (cat_id, 'Ziploc bags',                'wet gear, wet shoes',             6),
    (cat_id, 'Snacks / protein bars',      null,                              7),
    (cat_id, 'Empty duffel for the way home', 'pro shop damage adds up',      8),
    (cat_id, 'Small daypack',              null,                              9);
end $$;
