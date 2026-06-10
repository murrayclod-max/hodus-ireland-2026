import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TripWeatherClient from '@/components/TripWeatherClient';

export const revalidate = 1800;

// Course display names for the location line
const COURSE_NAMES: Record<string, string> = {
  rcd:         'Newcastle, NI',
  portrush:    'Portrush, NI',
  portstewart: 'Portstewart, NI',
  stpats:      'Donegal',
  otm:         'Donegal',
  portmarnock: 'Dublin',
};

// Fallback location by day offset from Sep 12 if no round that day
// 0=Sep12 → Dublin, 1=Sep13 → NI, 2=Sep14 → NI, 3=Sep15 → NI,
// 4=Sep16 → NI, 5=Sep17 → Donegal, 6=Sep18 → Donegal,
// 7=Sep19 → Donegal, 8=Sep20 → Dublin, 9=Sep21 → Dublin
const FALLBACK_SLUGS: Record<string, string> = {
  '2026-09-12': 'portmarnock',
  '2026-09-13': 'rcd',
  '2026-09-14': 'rcd',
  '2026-09-15': 'portrush',
  '2026-09-16': 'portrush',
  '2026-09-17': 'stpats',
  '2026-09-18': 'stpats',
  '2026-09-19': 'otm',
  '2026-09-20': 'portmarnock',
  '2026-09-21': 'portmarnock',
};

const TRIP_DAYS = [
  '2026-09-12', '2026-09-13', '2026-09-14', '2026-09-15', '2026-09-16',
  '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20', '2026-09-21',
];

function fmtDayLabel(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

export default async function WeatherPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: player } = await supabase
    .from('players').select('id').eq('auth_user_id', user.id).maybeSingle();
  const db = player ? supabase : createServiceClient();

  const { data: rounds } = await db
    .from('rounds')
    .select('play_date, round_no, in_competition, tee_time, courses(slug, name)')
    .order('play_date');

  // Build date → round info map
  type RoundRow = { play_date: string; round_no: number; in_competition: boolean; tee_time: string; courses: { slug: string; name: string } | null };
  const roundByDate = new Map<string, RoundRow>();
  for (const r of (rounds ?? []) as RoundRow[]) {
    if (!roundByDate.has(r.play_date)) roundByDate.set(r.play_date, r);
  }

  const days = TRIP_DAYS.map(date => {
    const round = roundByDate.get(date);
    const slug = round?.courses?.slug ?? FALLBACK_SLUGS[date] ?? 'rcd';
    const roundLabel = round
      ? `${round.in_competition ? `Round ${round.round_no}` : 'Appetizer'} — ${round.courses?.name ?? ''} · ${round.tee_time}`
      : undefined;
    return {
      date,
      label: fmtDayLabel(date),
      slug,
      locationName: COURSE_NAMES[slug] ?? slug,
      roundLabel,
    };
  });

  return (
    <div>
      <div className="page-header">
        <div className="wrap">
          <h1>⛅ Weather</h1>
          <p className="sub">Sep 12–21 · 6-hourly forecast</p>
        </div>
      </div>

      <div className="wrap stack-sm" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>
        <div className="card" style={{ background: 'rgba(201,162,75,0.07)', borderColor: 'var(--gilt)', padding: 'var(--s-3) var(--s-4)' }}>
          <p className="small" style={{ color: '#7a5c10' }}>
            📊 Showing historical September averages — live forecasts from Open-Meteo will replace these within 14 days of each date.
          </p>
        </div>

        <TripWeatherClient days={days} />
      </div>
    </div>
  );
}
