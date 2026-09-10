// The aerial for one hole, with an optional yardage scale down the left edge.
// Assumes the photo is cropped tee at the bottom, centre of the green at the
// top, so the scale runs 0 to the hole's card yardage. Exact on a straight
// hole, a fair guide on a dogleg. Renders a placeholder until the photo is in.

const RATIO = 1364 / 520; // the aerials come in at 520 x 1364

function ticksFor(yards: number): number[] {
  const step = yards <= 200 ? 25 : 50;
  const out: number[] = [];
  for (let y = step; y < yards - step / 2; y += step) out.push(y);
  return out;
}

export default function HoleAerial({
  slug, n, yards, photo = true, scale = false, maxWidth = 300, className,
}: {
  slug: string; n: number; yards: number;
  photo?: boolean; scale?: boolean; maxWidth?: number; className?: string;
}) {
  const scaleW = scale ? 22 : 0;
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'stretch', width: '100%', maxWidth: maxWidth + scaleW, margin: '0 auto' }}>
      {scale && (
        <div style={{ position: 'relative', width: scaleW, flexShrink: 0, borderRight: '1px solid #b8b3a5', marginRight: 3 }}>
          {[0, ...ticksFor(yards), yards].map(y => (
            <div key={y} style={{
              position: 'absolute', right: 0, bottom: `${(y / yards) * 100}%`,
              transform: 'translateY(50%)', display: 'flex', alignItems: 'center', gap: 2,
              fontSize: 9, lineHeight: 1, color: '#6E6E64', fontVariantNumeric: 'tabular-nums',
              fontWeight: y === 0 || y === yards ? 700 : 500,
            }}>
              <span>{y === 0 ? 'T' : y}</span>
              <span style={{ width: y % 50 === 0 ? 5 : 3, height: 1, background: '#8a8578' }} />
            </div>
          ))}
        </div>
      )}
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/guides/${slug}/hole-${n}.jpg`}
          alt={`Hole ${n} from the air`}
          loading={n <= 2 ? 'eager' : 'lazy'}
          style={{ flex: 1, minWidth: 0, height: 'auto', display: 'block', borderRadius: 6, border: '1px solid #d8d3c5' }}
        />
      ) : (
        <div style={{
          flex: 1, minWidth: 0, aspectRatio: `1 / ${RATIO}`, borderRadius: 6,
          border: '1px dashed #b8b3a5', background: '#f3f0e6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#9a958a', fontSize: 11, textAlign: 'center', padding: 8, lineHeight: 1.4,
        }}>
          Aerial<br />to come
        </div>
      )}
    </div>
  );
}
