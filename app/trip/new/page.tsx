'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function NewItineraryItemPage() {
  const router = useRouter();
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [kind, setKind] = useState('note');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!date || !title) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('itinerary_items').insert({ day_date: date, title, detail: detail || null, kind, sort: 99 });
    setSaving(false);
    router.push('/trip');
    router.refresh();
  }

  return (
    <div>
      <div className="page-header">
        <div className="wrap row-between">
          <h1>Add Item</h1>
          <Link href="/trip" className="btn btn-ghost" style={{ color: '#fff' }}><X size={18} /></Link>
        </div>
      </div>
      <div className="wrap stack" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>
        <label className="field">Date<input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
        <label className="field">Title<input className="input" value={title} onChange={e => setTitle(e.target.value)} /></label>
        <label className="field">Detail<textarea className="textarea" value={detail} onChange={e => setDetail(e.target.value)} /></label>
        <label className="field">Kind
          <select className="select" value={kind} onChange={e => setKind(e.target.value)}>
            <option value="travel">Travel</option>
            <option value="golf">Golf</option>
            <option value="lodging">Lodging</option>
            <option value="note">Note</option>
          </select>
        </label>
        <button className="btn btn-primary btn-block" onClick={save} disabled={saving || !date || !title}>
          <Check size={16} />{saving ? 'Saving…' : 'Add Item'}
        </button>
      </div>
    </div>
  );
}
