// Cartoon SVG map of Northern Ireland + NW Donegal showing the 5 trip courses.
// Static component — no client state needed.

export default function TripMap() {
  return (
    <div style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
      {/* Title above the map */}
      <div style={{ textAlign: 'center', paddingBottom: 'var(--s-4)' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.4rem, 12vw, 4rem)',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          lineHeight: 1,
          color: '#fff',
        }}>
          <span style={{ color: 'var(--gilt)' }}>HODUS</span>
          {' '}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.15em',
          }}>
            <span style={{
              background: 'var(--green)', color: 'var(--gilt)',
              borderRadius: 8, padding: '0 12px', fontSize: '0.9em',
            }}>5</span>
            <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '0.8em' }}>–</span>
            <span style={{
              background: 'var(--rail-portrush)', color: '#fff',
              borderRadius: 8, padding: '0 12px', fontSize: '0.9em',
            }}>0</span>
          </span>
        </div>
        <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '0.82rem', marginTop: 4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Northern Ireland &amp; Donegal · Sept 2026
        </p>
      </div>

      {/* SVG cartoon map */}
      <svg
        viewBox="0 0 390 240"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 'var(--r-xl)', overflow: 'visible' }}
        aria-label="Map of Northern Ireland and Donegal showing trip courses"
      >
        <defs>
          <linearGradient id="oceanGrad" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="#081c2e" />
            <stop offset="100%" stopColor="#0e3552" />
          </linearGradient>
          <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.5" />
          </filter>
          <filter id="landShadow">
            <feDropShadow dx="1" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.25" />
          </filter>
          {/* Subtle land texture — diagonal hatching */}
          <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
          </pattern>
        </defs>

        {/* Ocean */}
        <rect width="390" height="240" fill="url(#oceanGrad)" rx="12" />

        {/* Ocean wave lines */}
        {[40, 80, 120, 160, 200].map(y => (
          <path
            key={y}
            d={`M0,${y} Q18,${y - 5} 36,${y} Q54,${y + 5} 72,${y} Q90,${y - 5} 108,${y}`}
            stroke="#1e5278" strokeWidth="1" fill="none" opacity="0.45"
          />
        ))}

        {/* Donegal land mass (northwest) */}
        <path
          d="M120,78 C105,88 88,104 70,142 C58,132 36,110 34,80 C36,58 52,44 66,28 C78,16 100,6 122,8 C142,10 158,24 162,38 C148,44 134,58 120,78Z"
          fill="#246834"
          filter="url(#landShadow)"
        />
        <path
          d="M120,78 C105,88 88,104 70,142 C58,132 36,110 34,80 C36,58 52,44 66,28 C78,16 100,6 122,8 C142,10 158,24 162,38 C148,44 134,58 120,78Z"
          fill="url(#hatch)"
        />

        {/* Northern Ireland land mass */}
        <path
          d="M120,78 C134,58 148,44 162,38 C182,38 215,38 250,34 C268,30 285,28 300,30 L338,102 L352,158 C340,180 322,204 290,222 C260,234 220,238 175,234 C140,230 105,218 82,196 C72,184 66,162 68,142 C88,104 105,88 120,78Z"
          fill="#1e5430"
          filter="url(#landShadow)"
        />
        <path
          d="M120,78 C134,58 148,44 162,38 C182,38 215,38 250,34 C268,30 285,28 300,30 L338,102 L352,158 C340,180 322,204 290,222 C260,234 220,238 175,234 C140,230 105,218 82,196 C72,184 66,162 68,142 C88,104 105,88 120,78Z"
          fill="url(#hatch)"
        />

        {/* Mourne Mountains (decorative triangles near RCD) */}
        <g fill="#174e28" opacity="0.75">
          <polygon points="288,205 302,182 316,205" />
          <polygon points="304,208 318,186 332,208" />
          <polygon points="275,208 287,188 300,208" />
        </g>

        {/* Atlantic label */}
        <text x="24" y="175" fill="#4da8d4" opacity="0.5" fontSize="9.5" fontStyle="italic" fontFamily="Georgia, serif">Atlantic</text>
        <text x="24" y="188" fill="#4da8d4" opacity="0.5" fontSize="9.5" fontStyle="italic" fontFamily="Georgia, serif">Ocean</text>

        {/* Irish Sea label */}
        <text x="374" y="142" textAnchor="end" fill="#4da8d4" opacity="0.5" fontSize="9" fontStyle="italic" fontFamily="Georgia, serif">Irish</text>
        <text x="374" y="154" textAnchor="end" fill="#4da8d4" opacity="0.5" fontSize="9" fontStyle="italic" fontFamily="Georgia, serif">Sea</text>

        {/* Dashed route connecting courses in trip order: Rosapenna → Portstewart → Portrush → RCD */}
        <polyline
          points="68,40 196,46 218,35 318,200"
          fill="none" stroke="rgba(201,162,75,0.45)" strokeWidth="1.5" strokeDasharray="5 4"
        />

        {/* ── COURSE PINS ── */}

        {/* Rosapenna — R4–6 (Donegal, NW) */}
        <g filter="url(#pinShadow)">
          <circle cx="68" cy="40" r="16" fill="#4E2F6B" stroke="#fff" strokeWidth="2" />
          <text x="68" y="44.5" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold" fontFamily="Georgia, serif">R4–6</text>
        </g>
        <text x="68" y="64" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="600" fontFamily="Arial, sans-serif" opacity="0.9">ROSAPENNA</text>

        {/* Portstewart — R3 */}
        <g filter="url(#pinShadow)">
          <circle cx="196" cy="44" r="13" fill="#11574B" stroke="#fff" strokeWidth="2" />
          <text x="196" y="48" textAnchor="middle" fill="#fff" fontSize="9.5" fontWeight="bold" fontFamily="Georgia, serif">R3</text>
        </g>

        {/* Portrush — R2 (slightly right + above Portstewart) */}
        <g filter="url(#pinShadow)">
          <circle cx="220" cy="33" r="13" fill="#163A5F" stroke="#fff" strokeWidth="2" />
          <text x="220" y="37" textAnchor="middle" fill="#fff" fontSize="9.5" fontWeight="bold" fontFamily="Georgia, serif">R2</text>
        </g>
        {/* Shared label for R2+R3 */}
        <text x="208" y="65" textAnchor="middle" fill="#fff" fontSize="7.5" fontWeight="600" fontFamily="Arial, sans-serif" opacity="0.9">CAUSEWAY COAST</text>

        {/* Royal County Down — R1 (SE, near Mournes) */}
        <g filter="url(#pinShadow)">
          <circle cx="318" cy="200" r="16" fill="#7A1A2B" stroke="#fff" strokeWidth="2" />
          <text x="318" y="204.5" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold" fontFamily="Georgia, serif">R1</text>
        </g>
        <text x="318" y="223" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="600" fontFamily="Arial, sans-serif" opacity="0.9">ROYAL CO. DOWN</text>

        {/* Compass rose (top-right corner) */}
        <g transform="translate(367, 22)" opacity="0.6">
          <circle cx="0" cy="0" r="10" fill="none" stroke="#4da8d4" strokeWidth="0.8" />
          <line x1="0" y1="-6" x2="0" y2="-2" stroke="#4da8d4" strokeWidth="1.5" />
          <text x="0" y="-8" textAnchor="middle" fill="#4da8d4" fontSize="7" fontWeight="bold" fontFamily="Arial, sans-serif">N</text>
        </g>
      </svg>

      {/* Legend */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)', justifyContent: 'center',
        marginTop: 'var(--s-4)',
      }}>
        {[
          { label: 'R1 Royal County Down', color: '#7A1A2B' },
          { label: 'R2 Royal Portrush', color: '#163A5F' },
          { label: 'R3 Portstewart', color: '#11574B' },
          { label: 'R4–6 Rosapenna', color: '#4E2F6B' },
        ].map(({ label, color }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,.7)' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, border: '1.5px solid rgba(255,255,255,.3)', flexShrink: 0 }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
