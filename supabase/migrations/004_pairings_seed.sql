-- Seed pairings and matches for all 6 rounds

do $$
declare
  p_dan     uuid; p_mitchell uuid; p_eric   uuid;
  p_hodus   uuid; p_burns    uuid; p_todd   uuid;
  p_harris  uuid; p_joe      uuid; p_lee    uuid;
  p_hughes  uuid; p_galen    uuid; p_jeff   uuid;
  r1 uuid; r2 uuid; r3 uuid; r4 uuid; r5 uuid; r6 uuid;
  mp uuid; hp uuid;
  rnd record;
  sl integer;
begin
  select id into p_dan     from players where name='Dan Murray';
  select id into p_mitchell from players where name='Jim Mitchell';
  select id into p_eric    from players where name='Eric Strong';
  select id into p_hodus   from players where name='Matt Hodus';
  select id into p_burns   from players where name='Matt Burns';
  select id into p_todd    from players where name='Todd Moutafian';
  select id into p_harris  from players where name='Dave Harris';
  select id into p_joe     from players where name='Joe Gulash';
  select id into p_lee     from players where name='Lee Einhorn';
  select id into p_hughes  from players where name='Jim Hughes';
  select id into p_galen   from players where name='Galen Archibald';
  select id into p_jeff    from players where name='Jeff Pinkson';

  select id into r1 from rounds where round_no=1;
  select id into r2 from rounds where round_no=2;
  select id into r3 from rounds where round_no=3;
  select id into r4 from rounds where round_no=4;
  select id into r5 from rounds where round_no=5;
  select id into r6 from rounds where round_no=6;

  -- Round 1
  insert into pairings (round_id, team, player_a, player_b, slot) values
    (r1,'murray',p_dan,p_mitchell,1),(r1,'murray',p_eric,p_todd,2),(r1,'murray',p_hodus,p_burns,3),
    (r1,'harris',p_harris,p_joe,1),(r1,'harris',p_lee,p_jeff,2),(r1,'harris',p_hughes,p_galen,3);

  -- Round 2
  insert into pairings (round_id, team, player_a, player_b, slot) values
    (r2,'murray',p_dan,p_eric,1),(r2,'murray',p_hodus,p_mitchell,2),(r2,'murray',p_burns,p_todd,3),
    (r2,'harris',p_harris,p_lee,1),(r2,'harris',p_hughes,p_joe,2),(r2,'harris',p_galen,p_jeff,3);

  -- Round 3
  insert into pairings (round_id, team, player_a, player_b, slot) values
    (r3,'murray',p_dan,p_hodus,1),(r3,'murray',p_burns,p_eric,2),(r3,'murray',p_todd,p_mitchell,3),
    (r3,'harris',p_harris,p_hughes,1),(r3,'harris',p_galen,p_lee,2),(r3,'harris',p_jeff,p_joe,3);

  -- Round 4
  insert into pairings (round_id, team, player_a, player_b, slot) values
    (r4,'murray',p_dan,p_burns,1),(r4,'murray',p_todd,p_hodus,2),(r4,'murray',p_mitchell,p_eric,3),
    (r4,'harris',p_harris,p_galen,1),(r4,'harris',p_jeff,p_hughes,2),(r4,'harris',p_joe,p_lee,3);

  -- Round 5
  insert into pairings (round_id, team, player_a, player_b, slot) values
    (r5,'murray',p_dan,p_todd,1),(r5,'murray',p_mitchell,p_burns,2),(r5,'murray',p_eric,p_hodus,3),
    (r5,'harris',p_harris,p_jeff,1),(r5,'harris',p_joe,p_galen,2),(r5,'harris',p_lee,p_hughes,3);

  -- Round 6 = Round 1
  insert into pairings (round_id, team, player_a, player_b, slot) values
    (r6,'murray',p_dan,p_mitchell,1),(r6,'murray',p_eric,p_todd,2),(r6,'murray',p_hodus,p_burns,3),
    (r6,'harris',p_harris,p_joe,1),(r6,'harris',p_lee,p_jeff,2),(r6,'harris',p_hughes,p_galen,3);

  -- Create 3 matches per round (slot 1 vs slot 1, 2 vs 2, 3 vs 3)
  for rnd in (select id from rounds order by round_no) loop
    for sl in 1..3 loop
      select id into mp from pairings where round_id=rnd.id and team='murray' and slot=sl;
      select id into hp from pairings where round_id=rnd.id and team='harris' and slot=sl;
      if mp is not null and hp is not null then
        insert into matches (round_id, murray_pairing_id, harris_pairing_id, status, murray_points, harris_points)
        values (rnd.id, mp, hp, 'pending', 0, 0);
      end if;
    end loop;
  end loop;
end;
$$;
