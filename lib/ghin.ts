/**
 * GHIN handicap-index lookups.
 *
 * GHIN's public API (api2.ghin.com) requires a bearer token obtained by
 * logging in with real golfer credentials. The daily cron uses GHIN_EMAIL
 * and GHIN_PASSWORD env vars to mint a token fresh each run.
 */

const GHIN_API = 'https://api2.ghin.com/api/v1';

type GhinLoginResponse = {
  golfer_user?: { golfer_user_token?: string };
  golfer_user_token?: string;
};

type GhinGolferSearch = {
  golfers?: Array<{
    ghin?: string;
    handicap_index?: string | number;
    low_hi?: string | number;
    last_name?: string;
    first_name?: string;
  }>;
};

export async function loginGhin(): Promise<string> {
  const email = process.env.GHIN_EMAIL;
  const password = process.env.GHIN_PASSWORD;
  if (!email || !password) throw new Error('GHIN_EMAIL / GHIN_PASSWORD not set');

  const res = await fetch(`${GHIN_API}/golfer_login.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
    body: JSON.stringify({
      user: { email_or_ghin: email, password, remember_me: false },
      token: 'nonce',
      source: 'GHINcom',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GHIN login failed: ${res.status} ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as GhinLoginResponse;
  const token = data.golfer_user?.golfer_user_token ?? data.golfer_user_token;
  if (!token) throw new Error('GHIN login returned no token');
  return token;
}

export type GhinRevision = {
  revisionDate: string;   // 'YYYY-MM-DD'
  indexValue: number;
  lowHi: number | null;
};

/**
 * Fetches the handicap revision history for a golfer across a date range.
 * GHIN publishes revisions roughly weekly during active season, so a full
 * year of history typically returns ~40–52 rows.
 */
export async function fetchHandicapHistory(
  token: string,
  ghinNumber: string,
  dateBegin: string,   // 'YYYY-MM-DD'
  dateEnd: string,     // 'YYYY-MM-DD'
  revCount = 200,
): Promise<GhinRevision[]> {
  const url = `${GHIN_API}/golfers/${encodeURIComponent(ghinNumber)}/handicap_history.json`
    + `?date_begin=${dateBegin}&date_end=${dateEnd}&rev_count=${revCount}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`handicap_history ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    handicap_revisions?: Array<{ RevDate?: string; Display?: string; Value?: number | string; LowHI?: number | string }>;
  };
  const revs = data.handicap_revisions ?? [];

  const parseIdx = (v: unknown): number | null => {
    if (v == null) return null;
    if (typeof v === 'number') return v;
    const s = String(v).trim();
    if (!s) return null;
    if (s.startsWith('+')) return -Number(s.slice(1));
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  return revs
    .map((r) => {
      const dt = r.RevDate ? r.RevDate.slice(0, 10) : '';  // strip any time suffix
      const idx = parseIdx(r.Value ?? r.Display);
      const low = parseIdx(r.LowHI);
      if (!dt || idx == null) return null;
      return { revisionDate: dt, indexValue: idx, lowHi: low };
    })
    .filter((r): r is GhinRevision => r !== null);
}

export type GhinRecentRound = {
  date_played: string;       // 'YYYY-MM-DD'
  course_name: string;
  course_rating: number;
  slope_rating: number;
  gross_score: number;
  adjusted_gross_score: number;
  differential: number;
  raw: Record<string, unknown>;
};

/**
 * Fetches the N most recent posted scores for a golfer.
 * Returns an empty array if the golfer has no scores or the call fails.
 */
export async function fetchRecentGhinRounds(
  token: string,
  ghinNumber: string,
  count = 20,
): Promise<{ rounds: GhinRecentRound[]; rawResponse: unknown }> {
  // No status filter — return whatever the API gives us most recently.
  // The GHIN scores API field names vary; we normalise below.
  const url = `${GHIN_API}/golfers/${encodeURIComponent(ghinNumber)}/scores.json`
    + `?per_page=${count}&page=1`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`scores ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as Record<string, unknown>;

  // GHIN API response shape (confirmed from live response):
  // {
  //   recent_scores:   { scores: ScoreRow[] }  — often empty (tight recency window)
  //   revision_scores: { scores: ScoreRow[] }  — 20 scoring records used for handicap
  //   ...
  // }
  type ScoreRow = Record<string, unknown>;
  const revScores  = ((data.revision_scores as { scores?: ScoreRow[] } | undefined)?.scores ?? []);
  const recScores  = ((data.recent_scores  as { scores?: ScoreRow[] } | undefined)?.scores ?? []);
  // Merge, sort newest-first by played_at, take the most recent `count`
  const allRows = [...recScores, ...revScores];
  allRows.sort((a, b) =>
    String(b.played_at ?? '').localeCompare(String(a.played_at ?? ''))
  );
  const rows = allRows.slice(0, count);

  const parseNum = (v: unknown): number | null => {
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const results: GhinRecentRound[] = [];
  for (const row of rows) {
    // All field names are snake_case in this API (confirmed from live response)
    const datePlayed = typeof row.played_at === 'string' ? row.played_at.slice(0, 10) : '';
    const courseName = String(row.course_name ?? row.facility_name ?? '');
    const courseRating = parseNum(row.course_rating);
    const slopeRating  = parseNum(row.slope_rating);
    // No plain gross_score in API — use adjusted_gross_score for both fields
    const ags          = parseNum(row.adjusted_gross_score);
    const diff         = parseNum(row.differential);

    if (!datePlayed || !courseName || courseRating == null || slopeRating == null
        || ags == null || diff == null) continue;

    // Only include 18-hole validated rounds
    if (row.number_of_holes !== 18) continue;

    results.push({
      date_played: datePlayed,
      course_name: courseName,
      course_rating: courseRating,
      slope_rating: slopeRating,
      gross_score: ags,           // GHIN only exposes adjusted gross
      adjusted_gross_score: ags,
      differential: diff,
      raw: row,
    });
  }
  return { rounds: results, rawResponse: data };
}


export async function fetchIndexByGhin(token: string, ghinNumber: string): Promise<number | null> {
  const url = `${GHIN_API}/golfers/search.json?per_page=1&page=1&golfer_id=${encodeURIComponent(ghinNumber)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as GhinGolferSearch;
  const g = data.golfers?.[0];
  const raw = g?.handicap_index;
  if (raw == null) return null;

  // Index is usually a string like "8.4" or "+1.6"; convert "+x.y" to negative
  if (typeof raw === 'number') return raw;
  const s = String(raw).trim();
  if (s === '' || s.toUpperCase() === 'NH') return null;
  if (s.startsWith('+')) return -Number(s.slice(1));
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
