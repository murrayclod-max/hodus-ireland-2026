-- ── Trip settings ─────────────────────────────────────────────────
insert into trip_settings (id, buy_in, per_round, ace_pool_per_man, points_win, points_half, half_log_18, half_log_18_tie, rules_md)
values (1, 300, 50, 100, 1, 0.5, 0.5, 0.25,
'# Match Rules — Hodus 2026

## Format
Two teams of six. **Fourball (better-ball) match play** every round. Partners rotate so everyone plays with everyone. Round 6 (Sat St Patrick''s) is **alternate shot**.

## Points
- 1 point per match win · ½ point per half
- $50 per round / $300 buy-in per man

## Half-Log Rule
A closed-out match keeps playing. The 18th hole is replayed for ½ point (¼ if halved). Every hole matters, but the big-match winner still banks the lion''s share.

## Ace Pool
$100 per man. Paid straight to anyone who makes a hole-in-one.

## Standings
Running team totals: **Team Murray** vs **Team Harris**.
')
on conflict (id) do nothing;

-- ── Courses ───────────────────────────────────────────────────────
insert into courses (slug, name, location, par, yards, designer, founded, rail_color, crest_url, signature_holes, sort) values
('rcd', 'Royal County Down', 'Newcastle, Co. Down', 71, 7186, 'Old Tom Morris', '1889', '#7A1A2B', '/medallions/rcd.png',
 '[{"hole":4,"name":"Postcard","par":3,"yards":213,"note":"Iconic par 3 with the Mourne Mountains behind"},{"hole":9,"name":"Blind Glory","par":4,"yards":486,"note":"Blind tee shot over a ridge; the most photographed hole"},{"hole":18,"name":"The Finish","par":5,"yards":550,"note":"Sweeping dogleg home to the clubhouse"}]',
 1),
('portrush', 'Royal Portrush — Dunluce', 'Portrush', 71, 7381, 'Harry Colt', '1929', '#163A5F', '/medallions/portrush.png',
 '[{"hole":1,"name":"hughie","par":4,"yards":420,"note":"Opens with a sweeping right-to-left dogleg along the cliff top"},{"hole":5,"name":"White Rocks","par":4,"yards":372,"note":"Spectacular views of the White Rocks coastline"},{"hole":16,"name":"Calamity Corner","par":3,"yards":236,"note":"Ravine guarding the green; most famous par 3 in Ireland"}]',
 2),
('portstewart', 'Portstewart — Strand', 'Portstewart', 72, 7118, 'Park Jr / Des Giffin', '1992', '#11574B', '/medallions/portstewart.png',
 '[{"hole":1,"name":"Strand Opening","par":4,"yards":425,"note":"One of the best opening holes in Ireland — into the dunes from the beach"},{"hole":5,"name":"The Long One","par":4,"yards":480,"note":"Demanding par 4 through towering sandhills"},{"hole":6,"name":"The Short One","par":3,"yards":140,"note":"Short but treacherous; tight green surrounded by rough"}]',
 3),
('stpats', 'St Patrick''s Links', 'Rosapenna, Co. Donegal', 71, 6930, 'Tom Doak', '2021', '#0F5631', '/medallions/stpats.png',
 '[{"hole":4,"name":"The Reveal","par":4,"yards":380,"note":"Crests a ridge to reveal the full Atlantic panorama"},{"hole":14,"name":"The Beach","par":4,"yards":410,"note":"Plays along the beach; Atlantic Ocean in play on the right"},{"hole":15,"name":"The Climb","par":3,"yards":195,"note":"Uphill par 3; wind can add three clubs"}]',
 4),
('otm', 'Old Tom Morris Links', 'Rosapenna, Co. Donegal', 71, 6915, 'Old Tom Morris', '1893', '#4E2F6B', '/medallions/otm.png',
 '[{"hole":1,"name":"Strand Nine Opener","par":4,"yards":395,"note":"Ruddy''s 2009 Strand nine begins here — links golf at its most natural"},{"hole":10,"name":"Valley Nine","par":4,"yards":410,"note":"Old Tom''s original Valley/Tramore routing; unchanged since 1893"},{"hole":18,"name":"Natural Finish","par":4,"yards":420,"note":"Natural bentgrass greens; no two putts the same"}]',
 5)
on conflict (slug) do nothing;

-- ── Itinerary ─────────────────────────────────────────────────────
insert into itinerary_items (day_date, title, detail, kind, sort) values
('2026-09-13', 'Arrive Dublin', 'Fly into Dublin. Driver meets the last arriving flight. Transfer to Newcastle (~2 hrs). Check in Slieve Donard Resort.', 'travel', 1),
('2026-09-13', 'Slieve Donard Resort', 'Newcastle, Co. Down. Stunning Victorian hotel at the foot of the Mourne Mountains, steps from RCD.', 'lodging', 2),
('2026-09-14', 'Royal County Down', 'Tee time 9:22 AM. Championship Links, Newcastle. Old Tom Morris 1889.', 'golf', 1),
('2026-09-14', 'Drive to Portrush', 'After the round, drive north along the Antrim coast to Portrush (~2 hrs).', 'travel', 2),
('2026-09-14', 'Golflinks Hotel Portrush', 'Check in. 2 nights. Walking distance to Dunluce Links.', 'lodging', 3),
('2026-09-15', 'Royal Portrush — Dunluce', 'Tee time 11:16 AM. Host of The Open. Harry Colt masterpiece.', 'golf', 1),
('2026-09-16', 'Portstewart Strand', 'Tee time 11:00 AM. 15 min drive from Portrush.', 'golf', 1),
('2026-09-16', 'Drive to Rosapenna', 'After lunch, drive west to Donegal (~2.5 hrs). Spectacular Antrim Glens and Inishowen Peninsula route.', 'travel', 2),
('2026-09-17', 'St Patrick''s Links', 'Tee time 12:30 PM. Tom Doak 2021. Rosapenna, Donegal.', 'golf', 1),
('2026-09-17', 'Rosapenna Lodging', '3 nights. Self-arranged. Rosapenna Hotel or nearby cottages.', 'lodging', 2),
('2026-09-18', 'Old Tom Morris Links', 'Tee time 9:00 AM. 1893 original. On site at Rosapenna.', 'golf', 1),
('2026-09-19', 'St Patrick''s Links (Alt-Shot)', 'Tee time 9:00 AM. ALTERNATE SHOT format — Round 6. Then drive to Dublin (~3.5 hrs).', 'golf', 1),
('2026-09-19', 'Drive to Dublin Airport', 'After round and lunch, drive to Dublin. Check in Radisson Blu Dublin Airport.', 'travel', 2),
('2026-09-19', 'Radisson Blu Dublin Airport', 'Final night. Early checkout available for morning flights.', 'lodging', 3),
('2026-09-20', 'Depart', 'Fly home. Safe travels lads.', 'travel', 1)
on conflict do nothing;

-- ── Players ───────────────────────────────────────────────────────
-- Team Murray
insert into players (name, first_name, handicap_index, ghin, team, is_captain, is_admin, nickname, bio, home_club) values
('Dan Murray', 'Dan', 7.0, '1166349', 'murray', true, true, 'Game Master', 'Captain of Team Murray. Runs a tight ship and an even tighter scorecard.', 'Meadow Club'),
('Jim Mitchell', 'Jim', 5.5, '444527', 'murray', false, false, null, 'Lowest index in the field. No gimmes — not even from 2 inches.', null),
('Eric Strong', 'Eric', 12.1, null, 'murray', false, false, null, 'Lefty who plays righty. Hot putter. Dangerous on any surface.', null),
('Matt Hodus', 'Matt', 13.4, null, 'murray', false, false, 'Hodus', 'Organizer and heart of the trip. Clicks into gear on holes 7–15.', null),
('Matt Burns', 'Matt', 14.0, '261210', 'murray', false, false, null, 'Lefty with a lawyer''s brain for the scorecard. Knows the rules better than the rulebook.', null),
('Todd Moutafian', 'Todd', 15.3, '10327957', 'murray', false, false, 'Stumps', 'Made his first career ace this year. Riding the momentum.', null)
on conflict do nothing;

-- Team Harris
insert into players (name, first_name, handicap_index, ghin, team, is_captain, is_admin, nickname, bio, home_club) values
('Dave Harris', 'Dave', 17.0, '10681543', 'harris', true, true, null, 'Captain of Team Harris. Grinding that index down from 19. Will fight for every half.', null),
('Joe Gulash', 'Joe', 8.2, '1321246', 'harris', false, false, 'The Ringer', 'Plays to a legit 4. The ringer Harris needed.', null),
('Lee Einhorn', 'Lee', 11.4, '1317426', 'harris', false, false, null, 'Pure grinder. Gives absolutely nothing away on a golf course.', null),
('Jim Hughes', 'Jim', 13.5, '2376752', 'harris', false, false, null, 'Best hang of the trip. Slow player. Worth the wait.', null),
('Galen Archibald', 'Galen', 15.5, '10686298', 'harris', false, false, null, 'Great teammate with all-day energy. The glue guy.', null),
('Jeff Pinkson', 'Jeff', 18.0, '107793', 'harris', false, false, null, 'Shoots 80 or 100 — no in-between. Super fit. Brings the energy.', null)
on conflict do nothing;

-- ── Rounds ────────────────────────────────────────────────────────
-- We insert rounds after courses are inserted. Use subqueries to get course IDs.
insert into rounds (round_no, course_id, play_date, tee_time, format, is_altshot)
select 1, id, '2026-09-14', '9:22 AM', 'fourball', false from courses where slug='rcd'
on conflict do nothing;

insert into rounds (round_no, course_id, play_date, tee_time, format, is_altshot)
select 2, id, '2026-09-15', '11:16 AM', 'fourball', false from courses where slug='portrush'
on conflict do nothing;

insert into rounds (round_no, course_id, play_date, tee_time, format, is_altshot)
select 3, id, '2026-09-16', '11:00 AM', 'fourball', false from courses where slug='portstewart'
on conflict do nothing;

insert into rounds (round_no, course_id, play_date, tee_time, format, is_altshot)
select 4, id, '2026-09-17', '12:30 PM', 'fourball', false from courses where slug='stpats'
on conflict do nothing;

insert into rounds (round_no, course_id, play_date, tee_time, format, is_altshot)
select 5, id, '2026-09-18', '9:00 AM', 'fourball', false from courses where slug='otm'
on conflict do nothing;

insert into rounds (round_no, course_id, play_date, tee_time, format, is_altshot)
select 6, id, '2026-09-19', '9:00 AM', 'altshot', true from courses where slug='stpats'
on conflict do nothing;
