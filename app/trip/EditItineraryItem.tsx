'use client';

import { useState } from 'react';
import { Pencil, X, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { ItineraryItem } from '@/lib/types';

export default function EditItineraryItem({ item }: { item: ItineraryItem }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [detail, setDetail] = useState(item.detail ?? '');
  const [kind, setKind] = useState(item.kind);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from('itinerary_items').update({ title, detail, kind }).eq('id', item.id);
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-ghost btn-sm" style={{ minWidth: 36 }}>
        <Pencil size={14} />
      </button>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
      <div className="card card-lg" style={{ width: '100%', borderRadius: 'var(--r-xl) var(--r-xl) 0 0', paddingBottom: 'calc(var(--s-6) + env(safe-area-inset-bottom))' }}>
        <div className="row-between" style={{ marginBottom: 'var(--s-4)' }}>
          <h3>Edit Item</h3>
          <button onClick={() => setOpen(false)} className="btn btn-ghost btn-sm"><X size={18} /></button>
        </div>
        <div className="stack">
          <label className="field">Title<input className="input" value={title} onChange={e => setTitle(e.target.value)} /></label>
          <label className="field">Detail<textarea className="textarea" value={detail} onChange={e => setDetail(e.target.value)} /></label>
          <label className="field">Kind
            <select className="select" value={kind} onChange={e => setKind(e.target.value as ItineraryItem['kind'])}>
              <option value="travel">Travel</option>
              <option value="golf">Golf</option>
              <option value="lodging">Lodging</option>
              <option value="note">Note</option>
            </select>
          </label>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            <Check size={16} />{saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
