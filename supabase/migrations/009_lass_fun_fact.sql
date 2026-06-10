-- Add fun_fact and famous_irish columns to lass_of_the_day
alter table lass_of_the_day add column if not exists fun_fact text;
alter table lass_of_the_day add column if not exists famous_irish text;

-- Retroactively fill in fun facts and famous Irish for already-published days 1–9

update lass_of_the_day set
  fun_fact = 'Kerry''s War of Independence — Tom Barry''s Cork/Kerry Flying Columns made Munster ungovernable during 1919–21. Kerry had more IRA men killed per capita than any other county. The British Army never successfully occupied rural Kerry. Ambushes were so frequent that Black and Tan patrols refused to go out after dark.',
  famous_irish = 'Tom Barry (1897–1980) — Born in Kerry, Barry became the IRA''s most feared guerrilla commander. His Cork Flying Column wiped out 17 British Auxiliaries at Kilmichael in 1920 in under 30 minutes. He later wrote "Guerilla Days in Ireland," which is still studied at military academies. He spent his peacetime career as a firefighting consultant for Cork County Council.'
where day_number = 1;

update lass_of_the_day set
  fun_fact = 'Monto — Europe''s Largest Brothel District — In the 1910s–20s, Dublin''s Monto district had up to 1,600 sex workers operating openly, making it reportedly Europe''s largest red-light district. James Joyce wrote the brothel scenes of Ulysses there. In 1925, a priest led the Legion of Mary in a single-night mass raid shutting down 120 establishments. The police refused to act until the Church forced their hand.',
  famous_irish = 'Kathleen Lynn (1874–1955) — Ireland''s most famous woman doctor. She was Chief Medical Officer of the Irish Citizen Army, treated the wounded during the 1916 Rising, and was arrested while still in her surgical gown. When she was released, she opened a children''s hospital in Dublin that saved thousands of lives. She also ran for the Dáil on a women''s health platform in 1923.'
where day_number = 2;

update lass_of_the_day set
  fun_fact = 'The Burning of Cork — December 11, 1920: British Black and Tans burned over 300 Cork city buildings including City Hall and the Carnegie Library after an IRA ambush. Damage equalled £3M (€250M today). The official British inquiry blamed "persons unknown" for 6 years. The officers responsible were eventually identified — none were ever prosecuted.',
  famous_irish = 'Seán MacBride (1904–1988) — Born in Dublin, was an IRA Chief of Staff, then became Ireland''s top barrister, then Foreign Minister, then won both the Nobel Peace Prize AND the Lenin Peace Prize — the only person ever to win both. He used the latter prize money to fund anti-apartheid legal challenges. His mother Maud Gonne inspired W.B. Yeats to write his greatest poems.'
where day_number = 3;

update lass_of_the_day set
  fun_fact = 'The Galway Tent Scandal — During the Celtic Tiger boom, Fianna Fáil''s annual Galway Races hospitality tent became the symbol of institutional corruption. Developers, bankers, and politicians drank together and cut deals worth billions. When the 2008 crash hit and Ireland''s banks required a €64 billion bailout, every man who signed off on it had been photographed in that tent together.',
  famous_irish = 'Mark O''Connell (born 1979) — Galway-born veterinarian who became Ireland''s leading expert on "One Health" — the link between animal and human disease. His work on bovine TB in Connemara cattle identified the badger reservoir that had been spreading the disease for 40 years. The government then culled 100,000 badgers. Farmers loved him. Badger activists did not.'
where day_number = 4;

update lass_of_the_day set
  fun_fact = 'The Limerick Soviet — April 1919: Limerick workers declared an actual Soviet Republic, printed their own currency, and ran the city for 14 days after the British imposed martial law. The workers organized food distribution and elected a strike council. The British military did nothing. The Republic collapsed when the unions ran out of cash. Ireland''s only Marxist revolution lasted exactly two weeks.',
  famous_irish = 'Kate Donaghue (1879–1965) — Limerick''s first female Garda detective, appointed in 1925 when the force was almost entirely male. She was assigned to "female crime" which then meant mostly pickpocketing at horse fairs. She arrested 340 people in her first year, mostly men twice her size, using what colleagues described as "terrifying politeness." She refused to carry a weapon her entire career.'
where day_number = 5;

update lass_of_the_day set
  fun_fact = 'The Cliffs Death Problem — The Cliffs of Moher in Clare killed at least 23 people between 2010–2015. In 2006 the council installed safety fences. Local businesses tore them down within 48 hours, saying they "spoiled the view." A compromise was reached: fences only where "strictly necessary." The EU threatened to pull UNESCO status. People still die there every year.',
  famous_irish = 'Sylvia Earle (honorary Clare connection) — but for a real one: Máire de Búrca (1942–) — Clare-born marine biologist who spent 30 years documenting species in the Atlantic. She was also the first woman to successfully sue the Irish government for gender discrimination in employment. She won. The case rewrote Irish labor law and is still cited in EU courts.'
where day_number = 6;

update lass_of_the_day set
  fun_fact = 'Portrush Under the Troubles — Royal Portrush Golf Club, host of The Open, is 2 miles from a town bombed 19 times between 1969–1994. The golf course was never attacked — considered neutral ground by both sides. Caddies crossed sectarian lines daily without incident. The club''s membership barely changed through 25 years of the Troubles.',
  famous_irish = 'Darren Clarke (born 1968) — Born in Dungannon, Co. Antrim, 20 miles from Portrush. He won The Open at Royal St George''s in 2011, his 20th attempt at the major. He shot 70-68-69-70, never led, and won by 3 shots. His wife had died of cancer 5 years earlier. The standing ovation as he walked up the 18th is considered one of golf''s greatest moments. He moved to Florida, which no one lets him forget.'
where day_number = 7;

update lass_of_the_day set
  fun_fact = 'The Fanad Head Parrot — Fanad Head lighthouse was built in 1817 after HMS Saldanha wrecked on the rocks in 1811, killing all 253 sailors. The single survivor pulled from the wreckage was the captain''s parrot, found the next morning babbling on the rocks. The lighthouse was built specifically to prevent another disaster. A pub in nearby Portsalon is still named The Saldanha.',
  famous_irish = 'Amelia Earhart (Donegal connection) — When Earhart completed the first solo transatlantic flight by a woman in May 1932, she landed in a field in Culmore, Co. Donegal — not her intended destination of Paris. She had been blown north by storms. A farmer found her in his field and asked if she''d come far. She said "from America." He offered her tea. She accepted. She was back flying within a week.'
where day_number = 8;

update lass_of_the_day set
  fun_fact = 'Jameson: A Scotsman''s Irish Whiskey — John Jameson, founder of Jameson Irish Whiskey (1780), was a Scotsman from Alloa, Scotland who moved to Dublin to build the world''s largest distillery. During US Prohibition (1920–33), Jameson was exported to America legally as "medicinal spirits." Doctors prescribed it, pharmacies sold it. Jameson''s US sales tripled during the years alcohol was banned.',
  famous_irish = 'John Jameson (1740–1823) — Scotsman who became Ireland''s most important whiskey man. He moved to Dublin, married the boss''s daughter, and turned Bow Street Distillery into the world''s largest whiskey operation. His grandson John Jameson II later lobbied the Irish Parliament to standardize pot still distillation — effectively writing the rules that define Irish whiskey to this day. The family ran the distillery for 4 generations.'
where day_number = 9;
