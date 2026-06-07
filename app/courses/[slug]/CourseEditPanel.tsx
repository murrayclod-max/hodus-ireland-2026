'use client';

import { useState } from 'react';
import { Pencil, X, Check, Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Course, CourseTee } from '@/lib/types';

function emptyTee(): CourseTee {
  return { name: '', yards: 0, rating: 0, slope: 0, par: undefined, si: undefined };
}

function siToText(si: number[] | undefined): string {
  return si?.join(',') ?? '';
}

function parseSI(raw: string): number[] | undefined {
  const parts = raw.split(/[,\s]+/).map(s => parseInt(s, 10)).filter(n => !isNaN(n));
  if (parts.length === 18 && parts.every(n => n >= 1 && n <= 18)) return parts;
  return undefined;
}

export default function CourseEditPanel({ course }: { course: Course }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(course.notes_md ?? '');
  const [tees, setTees] = useState<CourseTee[]>(course.tees ?? []);
  const [siInputs, setSIInputs] = useState<string[]>(() => (course.tees ?? []).map(t => siToText(t.si)));
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function updateTee(i: number, field: keyof CourseTee, raw: string) {
    setTees(prev => prev.map((t, idx) => {
      if (idx !== i) return t;
      if (field === 'name') return { ...t, name: raw };
      const n = Number(raw);
      return { ...t, [field]: Number.isFinite(n) && raw !== '' ? n : t[field] };
    }));
  }

  function updateSI(i: number, raw: string) {
    setSIInputs(prev => prev.map((v, idx) => idx === i ? raw : v));
    const parsed = parseSI(raw);
    setTees(prev => prev.map((t, idx) => idx === i ? { ...t, si: parsed } : t));
  }

  function removeTee(i: number) {
    setTees(prev => prev.filter((_, idx) => idx !== i));
    setSIInputs(prev => prev.filter((_, idx) => idx !== i));
  }

  function addTee() {
    setTees(prev => [...prev, emptyTee()]);
    setSIInputs(prev => [...prev, '']);
  }

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from('courses').update({
      notes_md: notes || null,
      tees,
    }).eq('id', course.id);
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-secondary btn-sm">
        <Pencil size={14} /> Edit Course Info
      </button>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
      <div className="card card-lg" style={{
        width: '100%', borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
        paddingBottom: 'calc(var(--s-6) + env(safe-area-inset-bottom))',
        maxHeight: '90dvh', overflowY: 'auto',
      }}>
        <div className="row-between" style={{ marginBottom: 'var(--s-4)' }}>
          <h3>Edit Course Info</h3>
          <button onClick={() => setOpen(false)} className="btn btn-ghost btn-sm"><X size={18} /></button>
        </div>

        <div className="stack">
          {/* Tee boxes */}
          <div>
            <p className="section-label" style={{ marginBottom: 'var(--s-2)' }}>Tee Boxes</p>
            <div className="stack-sm">
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 6, padding: '0 4px' }}>
                {['Tee name', 'Yards', 'Rating', 'Slope', 'Par', ''].map((h, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mute)', fontFamily: 'var(--font-sans)' }}>{h}</span>
                ))}
              </div>
              {tees.map((tee, i) => (
                <div key={i} className="stack-xs">
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 6, alignItems: 'center' }}>
                    <input className="input" value={tee.name} onChange={e => updateTee(i, 'name', e.target.value)} placeholder="Championship" />
                    <input className="input" type="number" value={tee.yards || ''} onChange={e => updateTee(i, 'yards', e.target.value)} placeholder="7186" />
                    <input className="input" type="number" step="0.1" value={tee.rating || ''} onChange={e => updateTee(i, 'rating', e.target.value)} placeholder="74.3" />
                    <input className="input" type="number" value={tee.slope || ''} onChange={e => updateTee(i, 'slope', e.target.value)} placeholder="141" />
                    <input className="input" type="number" value={tee.par ?? ''} onChange={e => updateTee(i, 'par', e.target.value)} placeholder="72" />
                    <button onClick={() => removeTee(i)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger, #c84545)', padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {/* SI input — full row */}
                  <div style={{ paddingLeft: 0 }}>
                    <input
                      className="input"
                      value={siInputs[i] ?? ''}
                      onChange={e => updateSI(i, e.target.value)}
                      placeholder="Scorecard SI (18 values, e.g. 10,1,7,16,5,14,2,11,3,8,15,4,13,6,17,12,9,18)"
                      style={{ fontSize: 11, width: '100%' }}
                    />
                    {siInputs[i] && !tees[i].si && (
                      <p style={{ fontSize: 10, color: '#c84545', marginTop: 2 }}>Need exactly 18 values, each 1–18</p>
                    )}
                    {tees[i].si && (
                      <p style={{ fontSize: 10, color: 'var(--green)', marginTop: 2 }}>✓ 18 SI values saved</p>
                    )}
                  </div>
                </div>
              ))}
              <button onClick={addTee} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>
                <Plus size={14} /> Add Tee
              </button>
            </div>
          </div>

          {/* Notes */}
          <label className="field">Notes (markdown OK)
            <textarea className="textarea" style={{ minHeight: 100 }} value={notes} onChange={e => setNotes(e.target.value)} />
          </label>

          <button className="btn btn-primary" onClick={save} disabled={saving}>
            <Check size={16} />{saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
