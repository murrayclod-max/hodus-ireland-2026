import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { guideFor } from '@/lib/guides';
import PrintButton from './PrintButton';
import type { CourseGuide, GuideHole } from '@/lib/guides';
import './print.css';

export const revalidate = 3600;

// Each panel is a quarter of a letter sheet — 4.25 x 5.5in — so a sheet holds
// four, and 24 panels come out as six sheets: cover, rules, eighteen holes,
// the card, quick look, a match sheet and the back page.

function HolePanel({ hole, slug, tees }: { hole: GuideHole; slug: string; tees: string }) {
  return (
    <div className="panel">
      <div className="phead">
        <span className="pnum">{hole.n}</span>
        <span className="pmeta">PAR {hole.par} · {hole.yards} YDS · SI {hole.si}</span>
        <span className="ptags">
          {hole.tags.map(t => <span key={t} className="ptag">{t}</span>)}
          <span className={hole.source === 'joe' ? 'ptag ptag-joe' : 'ptag'}>{hole.source === 'joe' ? 'JOE' : 'GUIDE'}</span>
        </span>
      </div>
      <div className="pbody">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pmap" src={`/guides/${slug}/hole-${hole.n}.jpg`} alt="" />
        <div className="ptext">
          {hole.sections.map((s, i) => (
            <p key={i} className={s.joe ? 'joe' : ''}>
              <span className={s.label === 'JOE' ? 'plabel plabel-joe' : 'plabel'}>{s.label}</span>{' '}
              {s.text}
            </p>
          ))}
        </div>
      </div>
      <div className="pfoot">
        <span>Bold = Joe said it · Bunker yardages from the {tees.replace(' tees', '').toLowerCase()} tee</span>
        <span className="wind">WIND ________</span>
      </div>
    </div>
  );
}

export default async function GuidePrintPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const guide: CourseGuide | null = guideFor(slug);
  if (!guide) notFound();

  const outPar = guide.holes.slice(0, 9).reduce((s, h) => s + h.par, 0);
  const outYds = guide.holes.slice(0, 9).reduce((s, h) => s + h.yards, 0);
  const inPar = guide.holes.slice(9).reduce((s, h) => s + h.par, 0);
  const inYds = guide.holes.slice(9).reduce((s, h) => s + h.yards, 0);

  const panels: React.ReactNode[] = [];

  // 1 — cover
  panels.push(
    <div className="panel panel-cover" key="cover">
      <div className="ceyebrow">HODUS 50TH · SEPTEMBER 2026</div>
      <h1 className="ctitle">{guide.nameLines.map(l => <span key={l}>{l}</span>)}</h1>
      <div className="csub">{guide.subtitle}</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ccover" src={guide.cover} alt="" />
      <div className="cfg">Field Guide</div>
      <div className="cspec">{guide.tees} · Par {guide.par} · {guide.yards.toLocaleString()} yards</div>
      <div className="carch">{guide.architects}</div>
      <div className="cstrap">{guide.strapline}</div>
    </div>,
  );

  // 2 — Joe's rules
  panels.push(
    <div className="panel" key="rules">
      <h2 className="ph2">{guide.rulesTitle}</h2>
      <p className="pintro">{guide.rulesIntro} Bold means Joe said it.</p>
      <div className="prules">
        {guide.rules.map((r, i) => (
          <p key={i}><span className="rt">{i + 1}. {r.title}</span> {r.body}</p>
        ))}
      </div>
    </div>,
  );

  // 3–20 — the holes
  for (const hole of guide.holes) {
    panels.push(<HolePanel key={hole.n} hole={hole} slug={guide.slug} tees={guide.tees} />);
  }

  // 21 — the card
  panels.push(
    <div className="panel" key="card">
      <h2 className="ph2">The Card</h2>
      <p className="pintro">{guide.tees}, club scorecard. Last column is the call off the tee; bold is Joe&rsquo;s.</p>
      <table className="pcard">
        <thead><tr><th>HOLE</th><th>PAR</th><th>YDS</th><th>SI</th><th>OFF THE TEE</th></tr></thead>
        <tbody>
          {guide.holes.slice(0, 9).map(h => (
            <tr key={h.n}><td>{h.n}</td><td>{h.par}</td><td>{h.yards}</td><td>{h.si}</td><td className={h.teeIsJoe ? 'joe' : ''}>{h.offTheTee}</td></tr>
          ))}
          <tr className="sum"><td>OUT</td><td>{outPar}</td><td>{outYds}</td><td colSpan={2}></td></tr>
          {guide.holes.slice(9).map(h => (
            <tr key={h.n}><td>{h.n}</td><td>{h.par}</td><td>{h.yards}</td><td>{h.si}</td><td className={h.teeIsJoe ? 'joe' : ''}>{h.offTheTee}</td></tr>
          ))}
          <tr className="sum"><td>IN</td><td>{inPar}</td><td>{inYds}</td><td colSpan={2}></td></tr>
          <tr className="sum"><td>TOTAL</td><td>{guide.par}</td><td>{guide.yards.toLocaleString()}</td><td colSpan={2}></td></tr>
        </tbody>
      </table>
    </div>,
  );

  // 22 — quick look
  panels.push(
    <div className="panel" key="quick">
      <h2 className="ph2">Quick Look</h2>
      <p className="pintro">The holes that need a decision before you pull a club.</p>
      <div className="prules">
        {guide.quickLook.map((q, i) => (
          <p key={i} className={q.joe ? 'joe' : ''}><span className="rt">{q.title}</span> {q.body}</p>
        ))}
      </div>
    </div>,
  );

  // 23 — match sheet to fill in
  panels.push(
    <div className="panel" key="match">
      <h2 className="ph2">The Match</h2>
      <div className="mfield"><span>DATE</span><i /></div>
      <div className="mfield"><span>FORMAT</span><i /></div>
      <div className="mfield"><span>TEE TIMES</span><i /></div>
      <table className="pmatch">
        <thead><tr><th>MATCH</th><th>US</th><th>THEM</th><th>RESULT</th></tr></thead>
        <tbody>{[1, 2, 3, 4, 5, 6].map(n => <tr key={n}><td>{n}</td><td /><td /><td /></tr>)}</tbody>
      </table>
      <div className="mfield"><span>POINTS</span><i /></div>
      <div className="mfield"><span>NOTES</span><i /></div>
      <div className="mfield"><span /><i /></div>
    </div>,
  );

  // 24 — back page
  panels.push(
    <div className="panel panel-back" key="back">
      <div className="bmax">{guide.closing.map(l => <span key={l}>{l}</span>)}</div>
      <div className="bsub">{guide.closingSub}</div>
      <div className="bfoot">
        <div>HODUS 50TH · IRELAND · SEPTEMBER 2026</div>
        <div className="bcourses">Royal County Down · Royal Portrush · Portstewart · Rosapenna</div>
      </div>
    </div>,
  );

  const sheets: React.ReactNode[][] = [];
  for (let i = 0; i < panels.length; i += 4) sheets.push(panels.slice(i, i + 4));

  return (
    <div className="printroot">
      <div className="noprint">
        <div className="wrap" style={{ padding: 'var(--s-5) var(--s-4)' }}>
          <h2>{guide.name} — printable guide</h2>
          <p className="small muted" style={{ margin: '6px 0 12px' }}>
            {sheets.length} sheets of 8.5 × 11, four panels each. Print double-sided on the short edge if you want
            it as a booklet, or single-sided and cut along the dashed lines for {guide.holes.length} pocket cards.
            Set margins to None and turn on background graphics.
          </p>
          <PrintButton />
        </div>
      </div>

      {sheets.map((sheet, i) => (
        <div className="sheet" key={i}>{sheet}</div>
      ))}
    </div>
  );
}

