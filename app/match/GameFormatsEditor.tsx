'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { GameFormat } from '@/lib/types';

// Field definitions per format key
const FORMAT_FIELDS: Record<string, { key: string; label: string; suffix: string }[]> = {
  fourball: [{ key: 'pct',          label: 'Playing Handicap',      suffix: '% of difference' }],
  altshot:  [{ key: 'combined_pct', label: 'Team Playing Handicap', suffix: '% of combined CH' }],
  scramble: [
    { key: 'low_pct',  label: 'Low-handicapper',  suffix: '%' },
    { key: 'high_pct', label: 'High-handicapper',  suffix: '%' },
  ],
  chapman:  [
    { key: 'low_pct',  label: 'Low-handicapper',  suffix: '%' },
    { key: 'high_pct', label: 'High-handicapper',  suffix: '%' },
  ],
};

export default function GameFormatsEditor({ formats }: { formats: GameFormat[] }) {
  const [open, setOpen] = useState(false);
  const [params, setParams] = useState<Record<string, Record<string, number>>>(() =>
    Object.fromEntries(formats.map(f => [f.key, { ...f.params }]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const router = useRouter();

  async function saveFormat(key: string) {
    setSaving(key);
    const supabase = createClient();
    await supabase.from('game_formats').update({ params: params[key] }).eq('key', key);
    setSaving(null);
    router.refresh();
  }

  function updateParam(formatKey: string, field: string, raw: string) {
    const n = parseFloat(raw);
    if (!isNaN(n) && n >= 0 && n <= 100) {
      setParams(prev => ({ ...prev, [formatKey]: { ...prev[formatKey], [field]: n } }));
    }
  }

  return (
    <div className="card" style={{ borderColor: 'var(--border-soft)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <p className="section-label" style={{ margin: 0 }}>Format Handicap %</p>
        {open ? <ChevronUp size={16} style={{ color: 'var(--mute)' }} /> : <ChevronDown size={16} style={{ color: 'var(--mute)' }} />}
      </button>

      {open && (
        <div className="stack-sm" style={{ marginTop: 'var(--s-4)' }}>
          {formats.map(f => {
            const fields = FORMAT_FIELDS[f.key] ?? [];
            if (fields.length === 0) return null;
            const isDirty = JSON.stringify(params[f.key]) !== JSON.stringify(f.params);
            return (
              <div key={f.key} style={{ padding: 'var(--s-3)', borderRadius: 'var(--r-md)', background: 'var(--cream-dark)', border: '1px solid var(--border-soft)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 'var(--s-2)' }}>{f.name}</div>
                <div className="stack-xs">
                  {fields.map(field => (
                    <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
                      <label style={{ fontSize: 12, color: 'var(--mute)', minWidth: 140 }}>{field.label}</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={5}
                        value={params[f.key]?.[field.key] ?? ''}
                        onChange={e => updateParam(f.key, field.key, e.target.value)}
                        className="input"
                        style={{ width: 64, textAlign: 'right', fontSize: 13 }}
                      />
                      <span style={{ fontSize: 12, color: 'var(--mute)' }}>{field.suffix}</span>
                    </div>
                  ))}
                </div>
                {isDirty && (
                  <button
                    onClick={() => saveFormat(f.key)}
                    disabled={saving === f.key}
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: 'var(--s-2)' }}
                  >
                    <Check size={13} />{saving === f.key ? 'Saving…' : 'Save'}
                  </button>
                )}
              </div>
            );
          })}
          <p className="small muted" style={{ marginTop: 'var(--s-1)' }}>
            Changes apply to handicap calculations immediately. Hole-by-hole scoring is not affected.
          </p>
        </div>
      )}
    </div>
  );
}
