import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { guideFor } from '@/lib/guides';
import PrintButton from './PrintButton';
import HoleAerial from '@/components/HoleAerial';
import type { CourseGuide, GuideHole } from '@/lib/guides';
import './print.css';

export const revalidate = 3600;

// Each panel is a quarter of a letter sheet — 4.25 x 5.5in — so a sheet holds
// four, and 24 panels come out as six sheets: cover, rules, eighteen holes,
// the card, quick look, a match sheet and the back page.

function HolePanel({ hole, slug, tees, photos, scale }: { hole: GuideHole; slug: string; tees: string; photos: boolean; scale: boolean }) {
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
        <HoleAerial className="pmap" slug={slug} n={hole.n} yards={hole.yards} photo={photos} scale={scale} maxWidth={124} />
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
        <span>{scale ? `Scale in yards from the ${tees.replace(' tees', '').toLowerCase()} tee` : `Bold = Joe said it · Bunker yardages from the ${tees.replace(' tees', '').toLowerCase()} tee`}</span>
        <span className="wind">WIND ________</span>
      </div>
    </div>
  );
}

export default async function GuidePrintPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ layout?: string; duplex?: string }>;
}) {
  const { slug } = await params;
  const { layout, duplex } = await searchParams;
  const booklet = layout === 'booklet';
  const flipbook = layout === 'flipbook';
  // Printers default to long-edge duplex, which turns the back over sideways.
  // A flip book needs the back turned over the top, so for long-edge we bake
  // the extra half-turn into every back side. ?duplex=short leaves it out.
  const rotateBacks = flipbook && duplex !== 'short';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const guide: CourseGuide | null = guideFor(slug);
  if (!guide) notFound();

  const outPar = guide.holes.slice(0, 9).reduce((s, h) => s + h.par, 0);
  const outYds = guide.holes.slice(0, 9).reduce((s, h) => s + h.yards, 0);
  const inPar = guide.holes.slice(9).reduce((s, h) => s + h.par, 0);
  const inYds = guide.holes.slice(9).reduce((s, h) => s + h.yards, 0);

  const P: Record<string, React.ReactNode> = {};
  const holePanels: React.ReactNode[] = [];

  // 1 — cover
  P.cover = (
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
    </div>
  );

  // 2 — Joe's rules
  P.rules = (
    <div className="panel" key="rules">
      <h2 className="ph2">{guide.rulesTitle}</h2>
      <p className="pintro">{guide.rulesIntro} Bold means Joe said it.</p>
      <div className="prules">
        {guide.rules.map((r, i) => (
          <p key={i}><span className="rt">{i + 1}. {r.title}</span> {r.body}</p>
        ))}
      </div>
    </div>
  );

  // 3–20 — the holes
  for (const hole of guide.holes) {
    holePanels.push(<HolePanel key={hole.n} hole={hole} slug={guide.slug} tees={guide.tees} photos={guide.photos !== false} scale={!!guide.scale} />);
  }

  // 21 — the card
  P.card = (
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
    </div>
  );

  // 22 — quick look
  P.quick = (
    <div className="panel" key="quick">
      <h2 className="ph2">Quick Look</h2>
      <p className="pintro">The holes that need a decision before you pull a club.</p>
      <div className="prules">
        {guide.quickLook.map((q, i) => (
          <p key={i} className={q.joe ? 'joe' : ''}><span className="rt">{q.title}</span> {q.body}</p>
        ))}
      </div>
    </div>
  );

  // 23 — the day's groups for a social round, or a match sheet to fill in
  let groups: { slot: number; time: string; a: string[]; b: string[] }[] = [];
  if (guide.groupsRound !== undefined) {
    const { data: round } = await supabase
      .from('rounds').select('id, tee_time').eq('round_no', guide.groupsRound).maybeSingle();
    if (round) {
      const { data: pairs } = await supabase
        .from('pairings')
        .select('team, slot, a:player_a(name), b:player_b(name)')
        .eq('round_id', round.id).order('slot');
      const base = new Date(`2000-01-01 ${round.tee_time}`);
      const slots = [...new Set((pairs ?? []).map(p => p.slot))].sort();
      groups = slots.map(slot => {
        const t = new Date(base.getTime() + (slot - 1) * 10 * 60000);
        const time = t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const of = (team: string) => (pairs ?? []).filter(p => p.slot === slot && p.team === team)
          .flatMap(p => [(p.a as unknown as { name: string })?.name, (p.b as unknown as { name: string })?.name]).filter(Boolean) as string[];
        return { slot, time, a: of('murray'), b: of('harris') };
      });
    }
  }

  P.match = guide.groupsRound !== undefined ? (
    <div className="panel" key="groups">
      <h2 className="ph2">Tee Times</h2>
      <p className="pintro">Sunday 13 September · {groups.length} groups off the first tee · does not count towards the match</p>
      <table className="pmatch">
        <thead><tr><th>TIME</th><th>GROUP</th></tr></thead>
        <tbody>
          {groups.map(g => (
            <tr key={g.slot}><td style={{ fontWeight: 700 }}>{g.time}</td><td style={{ lineHeight: 1.3 }}>{[...g.a, ...g.b].join(' · ')}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="mfield"><span>SCORES</span><i /></div>
      <div className="mfield"><span /><i /></div>
      <div className="mfield"><span>NOTES</span><i /></div>
      <div className="mfield"><span /><i /></div>
    </div>
  ) : (
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
    </div>
  );

  // 24 — back page
  P.back = (
    <div className="panel panel-back" key="back">
      <div className="bmax">{guide.closing.map(l => <span key={l}>{l}</span>)}</div>
      <div className="bsub">{guide.closingSub}</div>
      <div className="bfoot">
        <div>HODUS 50TH · IRELAND · SEPTEMBER 2026</div>
        <div className="bcourses">Royal County Down · Royal Portrush · Portstewart · Rosapenna</div>
      </div>
    </div>
  );

  // Pocket cards: panels in reading order, four to a sheet, cut them all apart.
  //
  // Booklet: saddle-stitch imposition. Each letter sheet is cut across the
  // middle into two half-sheets; each half-sheet folds down its centre into two
  // leaves. Half-sheet s carries pages N-2(s-1) | 2(s-1)+1 on its outer face and
  // 2(s-1)+2 | N-2(s-1)-1 on its inner face. Printed long-edge duplex, the back
  // of the front-right panel lands at back-left, which is exactly what the
  // inner-face order gives — so no mirroring is needed.
  // Same order in every layout: cover, Joe's Rules behind it, then the holes
  const panels: React.ReactNode[] = [P.cover, P.rules, ...holePanels, P.card, P.quick, P.match, P.back];

  // Flip book: cut each sheet lengthwise into two 4.25 x 11 strips, stack them,
  // staple across the middle, fold the top halves back. Each strip is one
  // column. Printed SHORT-edge duplex the back of a column's bottom panel is
  // the back page's top panel in the same column, and every panel stays
  // upright in the layout — the printer's flip supplies the rotation that
  // makes each page read right way up when lifted. Strip s carries
  // N-2(s-1) over 2(s-1)+1 on its front and 2(s-1)+2 over N-2(s-1)-1 on its back.
  const N = panels.length;
  const sheets: React.ReactNode[][] = [];
  if (flipbook) {
    const pg = (n: number) => panels[n - 1];
    for (let s = 1; s <= N / 4; s += 2) {
      const [l, r] = [s, s + 1];
      const frontTop = (k: number) => pg(N - 2 * (k - 1));
      const frontBot = (k: number) => pg(2 * (k - 1) + 1);
      const backTop  = (k: number) => pg(2 * (k - 1) + 2);
      const backBot  = (k: number) => pg(N - 2 * (k - 1) - 1);
      sheets.push([frontTop(l), frontTop(r), frontBot(l), frontBot(r)]);
      sheets.push([backTop(l),  backTop(r),  backBot(l),  backBot(r)]);
    }
  } else if (!booklet) {
    for (let i = 0; i < N; i += 4) sheets.push(panels.slice(i, i + 4));
  } else {
    const pg = (n: number) => panels[n - 1];
    for (let hs = 1; hs <= N / 4; hs += 2) {
      const [a, b] = [hs, hs + 1];
      const outer = (s: number) => [pg(N - 2 * (s - 1)), pg(2 * (s - 1) + 1)];
      const inner = (s: number) => [pg(2 * (s - 1) + 2), pg(N - 2 * (s - 1) - 1)];
      sheets.push([...outer(a), ...outer(b)]);   // front of the letter sheet
      sheets.push([...inner(a), ...inner(b)]);   // back of the letter sheet
    }
  }

  return (
    <div className={flipbook ? 'printroot flipbook' : booklet ? 'printroot booklet' : 'printroot'}>
      <div className="noprint">
        <div className="wrap" style={{ padding: 'var(--s-5) var(--s-4)' }}>
          <h2>{guide.name} — printable guide</h2>
          <div style={{ display: 'flex', gap: 6, margin: '10px 0' }}>
            <Link href={`/courses/${slug}/guide/print`} className={`btn btn-sm ${!booklet ? 'btn-primary' : 'btn-secondary'}`}>Pocket cards</Link>
            <Link href={`/courses/${slug}/guide/print?layout=booklet`} className={`btn btn-sm ${booklet ? 'btn-primary' : 'btn-secondary'}`}>Side-stapled booklet</Link>
            <Link href={`/courses/${slug}/guide/print?layout=flipbook`} className={`btn btn-sm ${flipbook ? 'btn-primary' : 'btn-secondary'}`}>Yardage flip book</Link>
          </div>
          {flipbook ? (
            <p className="small muted" style={{ margin: '6px 0 12px' }}>
              Three sheets, printed <strong>double-sided with the printer&rsquo;s normal setting</strong> (long-edge — the
              back sides are already turned in the file). Cut each sheet lengthwise
              along the solid line into two 4.25 × 11 strips. Stack the six strips face up in the order of the small
              number by the dotted line, 1 on top. Staple twice across the dotted line, then fold the top halves back
              behind. The cover faces you; lift each page over the staples. Pages run 1 to {N}. Margins None, background
              graphics on.
            </p>
          ) : booklet ? (
            <p className="small muted" style={{ margin: '6px 0 12px' }}>
              Three sheets, printed <strong>double-sided, flip on the long edge</strong>. Cut each sheet across the
              middle along the solid line. Stack the six half-sheets in the order of the small number by each fold,
              1 on the bottom, then fold the stack down the dotted line and staple at the fold. Pages run 1 to {N}.
              Set margins to None and turn on background graphics.
            </p>
          ) : (
            <p className="small muted" style={{ margin: '6px 0 12px' }}>
              {sheets.length} sheets of 8.5 × 11, four panels each. Print single-sided and cut along the dashed lines
              for {N} pocket cards. Set margins to None and turn on background graphics.
            </p>
          )}
          <PrintButton />
        </div>
      </div>

      {sheets.map((sheet, i) => (
        <div className={rotateBacks && i % 2 === 1 ? 'sheet rot180' : 'sheet'} key={i}>
          {sheet}
          {booklet && i % 2 === 1 && (
            <>
              <span className="hsnum hsnum-top">{i}</span>
              <span className="hsnum hsnum-bottom">{i + 1}</span>
            </>
          )}
          {flipbook && i % 2 === 0 && (
            <>
              <span className="stripnum stripnum-left">{i + 1}</span>
              <span className="stripnum stripnum-right">{i + 2}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

