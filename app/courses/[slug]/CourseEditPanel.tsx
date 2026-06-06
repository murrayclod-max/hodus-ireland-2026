'use client';

import { useState } from 'react';
import { Pencil, X, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Course } from '@/lib/types';

export default function CourseEditPanel({ course }: { course: Course }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(course.notes_md ?? '');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from('courses').update({ notes_md: notes }).eq('id', course.id);
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-secondary btn-sm">
        <Pencil size={14} /> Edit Course Notes
      </button>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
      <div className="card card-lg" style={{ width: '100%', borderRadius: 'var(--r-xl) var(--r-xl) 0 0', paddingBottom: 'calc(var(--s-6) + env(safe-area-inset-bottom))' }}>
        <div className="row-between" style={{ marginBottom: 'var(--s-4)' }}>
          <h3>Edit Course Notes</h3>
          <button onClick={() => setOpen(false)} className="btn btn-ghost btn-sm"><X size={18} /></button>
        </div>
        <div className="stack">
          <label className="field">Notes (markdown OK)
            <textarea className="textarea" style={{ minHeight: 140 }} value={notes} onChange={e => setNotes(e.target.value)} />
          </label>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            <Check size={16} />{saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
