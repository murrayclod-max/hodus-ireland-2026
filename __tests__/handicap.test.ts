import { describe, it, expect } from 'vitest';
import {
  courseHandicap,
  fourballStrokes,
  teamPlayingHandicap,
  combinedMatchStrokes,
  strokeHoles,
} from '../lib/handicap';

describe('courseHandicap', () => {
  it('rounds correctly for positive index', () => {
    // CH = round(10.0 × (130/113) + (72.0 - 72)) = round(11.50) = 12
    expect(courseHandicap(10.0, 130, 72.0, 72)).toBe(12);
  });

  it('adds rating adjustment when course is harder than par', () => {
    // CH = round(5.0 × (113/113) + (73.5 - 72)) = round(5 + 1.5) = 7
    expect(courseHandicap(5.0, 113, 73.5, 72)).toBe(7);
  });

  it('subtracts rating adjustment when course is easier than par', () => {
    // CH = round(5.0 × (113/113) + (71.0 - 72)) = round(5 - 1) = 4
    expect(courseHandicap(5.0, 113, 71.0, 72)).toBe(4);
  });

  it('handles scratch handicap (0 index)', () => {
    expect(courseHandicap(0, 130, 72.0, 72)).toBe(0);
  });

  it('handles plus handicap (negative index)', () => {
    // CH = round(-2.0 × (113/113) + (72.0 - 72)) = round(-2) = -2
    expect(courseHandicap(-2.0, 113, 72.0, 72)).toBe(-2);
  });
});

describe('fourballStrokes', () => {
  it('gives 0 strokes to the lowest CH player', () => {
    const result = fourballStrokes(8, 14, 12, 10, 90);
    // low = 8 (m1). m2 = round((14-8)*0.9)=5, h1=round((12-8)*0.9)=4, h2=round((10-8)*0.9)=2
    expect(result.m1).toBe(0);
    expect(result.m2).toBe(5);
    expect(result.h1).toBe(4);
    expect(result.h2).toBe(2);
  });

  it('returns zeros when all players have equal CH', () => {
    const result = fourballStrokes(10, 10, 10, 10, 90);
    expect(result).toEqual({ m1: 0, m2: 0, h1: 0, h2: 0 });
  });

  it('respects pct=100', () => {
    const result = fourballStrokes(0, 10, 5, 3, 100);
    // low=0. m2=10, h1=5, h2=3
    expect(result.m1).toBe(0);
    expect(result.m2).toBe(10);
    expect(result.h1).toBe(5);
    expect(result.h2).toBe(3);
  });
});

describe('teamPlayingHandicap', () => {
  it('computes altshot PH using combined_pct', () => {
    // (12 + 8) * 50/100 = 10
    expect(teamPlayingHandicap(12, 8, { combined_pct: 50 })).toBe(10);
  });

  it('computes scramble PH using low/high pct', () => {
    // low=8, high=14. round(8*0.35 + 14*0.15) = round(2.8 + 2.1) = round(4.9) = 5
    expect(teamPlayingHandicap(14, 8, { low_pct: 35, high_pct: 15 })).toBe(5);
  });

  it('computes chapman PH using low/high pct', () => {
    // low=8, high=14. round(8*0.60 + 14*0.40) = round(4.8 + 5.6) = round(10.4) = 10
    expect(teamPlayingHandicap(14, 8, { low_pct: 60, high_pct: 40 })).toBe(10);
  });

  it('handles same CH in both slots', () => {
    expect(teamPlayingHandicap(10, 10, { combined_pct: 50 })).toBe(10);
  });
});

describe('combinedMatchStrokes', () => {
  it('returns murray as receiver when murray PH is higher', () => {
    // murrayPH = round((16+14)*0.5)=15, harrisPH = round((12+10)*0.5)=11 → murray receives 4
    const result = combinedMatchStrokes(16, 14, 12, 10, { combined_pct: 50 });
    expect(result.murrayPH).toBe(15);
    expect(result.harrisPH).toBe(11);
    expect(result.receiver).toBe('murray');
    expect(result.strokes).toBe(4);
  });

  it('returns harris as receiver when harris PH is higher', () => {
    const result = combinedMatchStrokes(10, 8, 16, 14, { combined_pct: 50 });
    expect(result.receiver).toBe('harris');
    expect(result.strokes).toBe(6);
  });

  it('returns level when PHs are equal', () => {
    const result = combinedMatchStrokes(10, 10, 10, 10, { combined_pct: 50 });
    expect(result.receiver).toBe('level');
    expect(result.strokes).toBe(0);
  });
});

describe('strokeHoles', () => {
  const exampleSI = [10, 2, 14, 6, 16, 4, 12, 18, 8, 1, 15, 5, 13, 3, 17, 7, 11, 9];

  it('returns empty array for 0 strokes', () => {
    expect(strokeHoles(exampleSI, 0)).toEqual([]);
  });

  it('returns the hole with SI=1 for 1 stroke', () => {
    // SI=1 is hole 10 (index 9 → hole 10)
    expect(strokeHoles(exampleSI, 1)).toEqual([10]);
  });

  it('returns correct holes for 3 strokes (SI 1,2,3)', () => {
    // SI 1 = hole 10, SI 2 = hole 2, SI 3 = hole 14
    const result = strokeHoles(exampleSI, 3);
    expect(result.sort((a, b) => a - b)).toEqual([2, 10, 14]);
  });

  it('returns all 18 holes for 18 strokes', () => {
    expect(strokeHoles(exampleSI, 18)).toHaveLength(18);
  });

  it('returns empty array when SI data missing', () => {
    expect(strokeHoles([], 5)).toEqual([]);
  });
});
