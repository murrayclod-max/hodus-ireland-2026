import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LassAdminPanel from '@/components/LassAdminPanel';
import LassScrollFeed, { LassFeedItem } from '@/components/LassScrollFeed';

export const revalidate = 60;

interface VoteRow { vote: number; user_id: string }

interface LassRow {
  id: string;
  day_number: number;
  profession: string;
  county: string;
  image_url: string;
  created_at: string;
  name: string | null;
  fun_fact: string | null;
  famous_irish: string | null;
  lass_votes: VoteRow[];
}

interface GhinRoundRow {
  player_id: string;
  date_played: string;
  course_name: string;
  gross_score: number;
  players: { name: string } | null;
}

export default async function LassPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: player } = await supabase
    .from('players').select('is_admin').eq('auth_user_id', user.id).maybeSingle();
  const isAdmin = !!player?.is_admin;
  const db = player ? supabase : await createServiceClient();

  // Try with name column; fall back if migration hasn't run yet
  let rows: LassRow[] | null = null;
  const { data: rowsFull, error: rowsError } = await db
    .from('lass_of_the_day')
    .select('id, day_number, profession, county, image_url, created_at, name, fun_fact, famous_irish, lass_votes(vote, user_id)')
    .eq('status', 'published')
    .order('day_number', { ascending: false }) as { data: LassRow[] | null; error: unknown };
  if (rowsError) {
    const { data: rowsFallback } = await db
      .from('lass_of_the_day')
      .select('id, day_number, profession, county, image_url, created_at, fun_fact, famous_irish, lass_votes(vote, user_id)')
      .eq('status', 'published')
      .order('day_number', { ascending: false }) as { data: LassRow[] | null };
    rows = (rowsFallback ?? []).map(r => ({ ...r, name: null }));
  } else {
    rows = rowsFull;
  }

  const { data: roundRows } = await db
    .from('ghin_recent_rounds')
    .select('player_id, date_played, course_name, gross_score, players(name)')
    .order('date_played', { ascending: false }) as { data: GhinRoundRow[] | null };

  // Build a map: dateStr -> formatted round strings
  const roundsByDate: Record<string, string[]> = {};
  for (const r of roundRows ?? []) {
    const lastName = (r.players?.name ?? 'Unknown').split(' ').pop() ?? 'Unknown';
    const entry = `${lastName} - ${r.course_name} - ${r.gross_score}`;
    if (!roundsByDate[r.date_played]) roundsByDate[r.date_played] = [];
    roundsByDate[r.date_played].push(entry);
  }

  const items: LassFeedItem[] = (rows ?? []).map(row => {
    const lassDate = row.created_at.slice(0, 10); // UTC date "YYYY-MM-DD"
    return {
      id: row.id,
      day_number: row.day_number,
      profession: row.profession,
      county: row.county,
      image_url: row.image_url,
      created_at: row.created_at,
      upvotes:     (row.lass_votes ?? []).filter(v => v.vote ===  1).length,
      downvotes:   (row.lass_votes ?? []).filter(v => v.vote === -1).length,
      userVote:    ((row.lass_votes ?? []).find(v => v.user_id === user.id)?.vote ?? null) as 1 | -1 | null,
      roundsThatDay: roundsByDate[lassDate] ?? [],
      name:        row.name,
      fun_fact:    row.fun_fact,
      famous_irish: row.famous_irish,
    };
  });

  return (
    <LassScrollFeed
      items={items}
      isAdmin={isAdmin}
      adminPanel={isAdmin ? <LassAdminPanel currentDayNumber={(items[0]?.day_number ?? 0) + 1} /> : undefined}
    />
  );
}
