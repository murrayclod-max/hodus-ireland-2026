// USGA Course Handicap: CH = round(HI × (slope/113) + (rating - par))
export function courseHandicap(
  index: number,
  slope: number,
  rating: number,
  par: number,
): number {
  return Math.round(index * (slope / 113) + (rating - par));
}

// Fourball (better-ball) stroke allocation — USGA Appendix C
// Lowest CH across all 4 players = baseline (0 strokes). Others get round((ch - low) × pct/100).
export function fourballStrokes(
  chM1: number, chM2: number, chH1: number, chH2: number,
  pct: number,
): { m1: number; m2: number; h1: number; h2: number } {
  const low = Math.min(chM1, chM2, chH1, chH2);
  const f = pct / 100;
  return {
    m1: Math.round((chM1 - low) * f),
    m2: Math.round((chM2 - low) * f),
    h1: Math.round((chH1 - low) * f),
    h2: Math.round((chH2 - low) * f),
  };
}

// Team Playing Handicap for combined-format matches (altshot, scramble, chapman)
// Params with combined_pct: team PH = round((ch1 + ch2) * combined_pct/100)
// Params with low_pct + high_pct: team PH = round(min_ch * low_pct/100 + max_ch * high_pct/100)
export function teamPlayingHandicap(
  ch1: number,
  ch2: number,
  params: Record<string, number>,
): number {
  if ('combined_pct' in params) {
    return Math.round((ch1 + ch2) * params.combined_pct / 100);
  }
  const [lo, hi] = ch1 <= ch2 ? [ch1, ch2] : [ch2, ch1];
  return Math.round(lo * (params.low_pct ?? 35) / 100 + hi * (params.high_pct ?? 15) / 100);
}

// Returns which team receives strokes and how many
export function combinedMatchStrokes(
  chM1: number, chM2: number, chH1: number, chH2: number,
  params: Record<string, number>,
): { murrayPH: number; harrisPH: number; receiver: 'murray' | 'harris' | 'level'; strokes: number } {
  const murrayPH = teamPlayingHandicap(chM1, chM2, params);
  const harrisPH = teamPlayingHandicap(chH1, chH2, params);
  const diff = murrayPH - harrisPH;
  return {
    murrayPH,
    harrisPH,
    receiver: diff > 0 ? 'murray' : diff < 0 ? 'harris' : 'level',
    strokes: Math.abs(diff),
  };
}

// Which holes (1-based) a player/team receives strokes on, given SI order and total strokes
// si[i] = stroke index of hole i+1 (so si[0] is SI for hole 1, etc.)
export function strokeHoles(si: number[], strokes: number): number[] {
  if (strokes <= 0 || si.length < 18) return [];
  const holes: number[] = [];
  for (let hole = 1; hole <= 18; hole++) {
    if ((si[hole - 1] ?? hole) <= strokes) holes.push(hole);
  }
  return holes;
}
