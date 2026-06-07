'use client';

import { useState } from 'react';

type GhinRoundRow = {
  date_played: string;
  course_name: string;
  course_rating: number;
  slope_rating: number;
  gross_score: number;
  adjusted_gross_score: number;
  differential: number;
};

function fmt(s: string): string {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
}

export default function GhinRecentRounds({ rounds }: { rounds: GhinRoundRow[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!rounds.length) return null;

  const visible = expanded ? rounds : rounds.slice(0, 3);

  return (
    <div className="board">
      <div className="board-title">Recent GHIN Rounds</div>
      <div style={{ padding: '0 4px 16px', overflowX: 'auto' }}>
        <table className="ht">
          <thead>
            <tr>
              <th>Date</th>
              <th>Course</th>
              <th className="num">Rating / Slope</th>
              <th className="num">Gross</th>
              <th className="num">AGS</th>
              <th className="num">Diff</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(r => (
              <tr key={`${r.date_played}-${r.course_name}`}>
                <td style={{ whiteSpace: 'nowrap' }}>{fmt(r.date_played)}</td>
                <td>{r.course_name}</td>
                <td className="num muted">{r.course_rating.toFixed(1)} / {r.slope_rating}</td>
                <td className="num">{r.gross_score}</td>
                <td className="num">{r.adjusted_gross_score}</td>
                <td className="num gilt" style={{ fontWeight: 600, color: 'var(--gilt)' }}>
                  {r.differential.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rounds.length > 3 && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              marginTop: 10, marginLeft: 10,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--gilt)', fontSize: 13, padding: 0,
              letterSpacing: '0.03em', fontFamily: 'var(--font-sans)',
            }}
          >
            {expanded ? `Show fewer ↑` : `Show all ${rounds.length} rounds ↓`}
          </button>
        )}
      </div>
    </div>
  );
}
