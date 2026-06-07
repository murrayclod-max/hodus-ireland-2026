'use client';

import { useState } from 'react';
import { Pencil, X, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Course } from '@/lib/types';

export default function CourseEditPanel({ course }: { course: Course }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(course.notes_md ?? '');
  const [teeName, setTeeName] = useState(course.tee_name ?? '');
  const [courseRating, setCourseRating] = useState(course.course_rating?.toString() ?? '');
  const [slopeRating, setSlopeRating] = useState(course.slope_rating?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from('courses').update({
      notes_md: notes || null,
      tee_name: teeName || null,
      course_rating: courseRating ? Number(courseRating) : null,
      slope_rating: slopeRating ? Number(slopeRating) : null,
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
      <div className="card card-lg" style={{ width: '100%', borderRadius: 'var(--r-xl) var(--r-xl) 0 0', paddingBottom: 'calc(var(--s-6) + env(safe-area-inset-bottom))' }}>
        <div className="row-between" style={{ marginBottom: 'var(--s-4)' }}>
          <h3>Edit Course Info</h3>
          <button onClick={() => setOpen(false)} className="btn btn-ghost btn-sm"><X size={18} /></button>
        </div>
        <div className="stack">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--s-3)' }}>
            <label className="field">Tee
              <input className="input" value={teeName} onChange={e => setTeeName(e.target.value)} placeholder="Championship" />
            </label>
            <label className="field">Rating
              <input className="input" type="number" step="0.1" value={courseRating} onChange={e => setCourseRating(e.target.value)} placeholder="74.3" />
            </label>
            <label className="field">Slope
              <input className="input" type="number" value={slopeRating} onChange={e => setSlopeRating(e.target.value)} placeholder="141" />
            </label>
          </div>
          <label className="field">Notes (markdown OK)
            <textarea className="textarea" style={{ minHeight: 120 }} value={notes} onChange={e => setNotes(e.target.value)} />
          </label>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            <Check size={16} />{saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
