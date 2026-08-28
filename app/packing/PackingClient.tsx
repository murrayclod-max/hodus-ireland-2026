'use client';

import { useMemo, useState } from 'react';
import { Check, Plus, Trash2, Pencil, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { PackingCategory, PackingItem } from '@/lib/types';

interface Props {
  playerId: string | null;
  categories: PackingCategory[];
  items: PackingItem[];
  checkedIds: string[];
}

export default function PackingClient({ playerId, categories: initialCats, items: initialItems, checkedIds }: Props) {
  const [cats, setCats] = useState(initialCats);
  const [items, setItems] = useState(initialItems);
  const [checked, setChecked] = useState<Set<string>>(new Set(checkedIds));
  const [editing, setEditing] = useState(false);
  const [newItem, setNewItem] = useState<Record<string, string>>({});
  const [newCat, setNewCat] = useState('');

  const byCategory = useMemo(() => {
    const map = new Map<string, PackingItem[]>();
    for (const item of items) {
      const list = map.get(item.category_id) ?? [];
      list.push(item);
      map.set(item.category_id, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.sort - b.sort);
    return map;
  }, [items]);

  const packed = items.filter(i => checked.has(i.id)).length;
  const pct = items.length ? Math.round((packed / items.length) * 100) : 0;

  async function toggle(itemId: string) {
    if (!playerId) return;
    const supabase = createClient();
    const next = new Set(checked);
    if (next.has(itemId)) {
      next.delete(itemId);
      setChecked(next);
      await supabase.from('packing_checks').delete().eq('player_id', playerId).eq('item_id', itemId);
    } else {
      next.add(itemId);
      setChecked(next);
      await supabase.from('packing_checks').insert({ player_id: playerId, item_id: itemId });
    }
  }

  async function addItem(categoryId: string) {
    const label = (newItem[categoryId] ?? '').trim();
    if (!label) return;
    const siblings = byCategory.get(categoryId) ?? [];
    const sort = Math.max(0, ...siblings.map(s => s.sort)) + 1;
    setNewItem(prev => ({ ...prev, [categoryId]: '' }));
    const supabase = createClient();
    const { data } = await supabase
      .from('packing_items').insert({ category_id: categoryId, label, sort }).select().single();
    if (data) setItems(prev => [...prev, data as PackingItem]);
  }

  async function renameItem(item: PackingItem, label: string) {
    const trimmed = label.trim();
    if (!trimmed || trimmed === item.label) return;
    setItems(prev => prev.map(i => (i.id === item.id ? { ...i, label: trimmed } : i)));
    await createClient().from('packing_items').update({ label: trimmed }).eq('id', item.id);
  }

  async function removeItem(item: PackingItem) {
    if (!confirm(`Delete "${item.label}" for everyone?`)) return;
    setItems(prev => prev.filter(i => i.id !== item.id));
    await createClient().from('packing_items').delete().eq('id', item.id);
  }

  async function addCategory() {
    const name = newCat.trim();
    if (!name) return;
    const sort = Math.max(0, ...cats.map(c => c.sort)) + 1;
    setNewCat('');
    const { data } = await createClient()
      .from('packing_categories').insert({ name, sort }).select().single();
    if (data) setCats(prev => [...prev, data as PackingCategory]);
  }

  async function removeCategory(cat: PackingCategory) {
    const count = (byCategory.get(cat.id) ?? []).length;
    if (!confirm(`Delete "${cat.name}" and its ${count} item${count === 1 ? '' : 's'} for everyone?`)) return;
    setCats(prev => prev.filter(c => c.id !== cat.id));
    setItems(prev => prev.filter(i => i.category_id !== cat.id));
    await createClient().from('packing_categories').delete().eq('id', cat.id);
  }

  async function clearMyTicks() {
    if (!playerId || !confirm('Untick everything on your list?')) return;
    setChecked(new Set());
    await createClient().from('packing_checks').delete().eq('player_id', playerId);
  }

  return (
    <div className="wrap stack-lg" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>

      {/* Progress */}
      <div className="card">
        <div className="row-between" style={{ marginBottom: 'var(--s-3)' }}>
          <div>
            <p className="section-label">Your bag</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600 }}>
              {packed} <span className="muted" style={{ fontSize: '1rem', fontWeight: 400 }}>of {items.length} packed</span>
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setEditing(e => !e)}>
            {editing ? <><X size={14} />Done</> : <><Pencil size={14} />Edit list</>}
          </button>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: 'var(--cream-dark)', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green)', transition: 'width var(--t-fast)' }} />
        </div>
        {packed > 0 && (
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 'var(--s-2)', padding: 0 }} onClick={clearMyTicks}>
            Clear my ticks
          </button>
        )}
      </div>

      {/* Categories */}
      {cats.map(cat => {
        const list = byCategory.get(cat.id) ?? [];
        const done = list.filter(i => checked.has(i.id)).length;
        return (
          <div key={cat.id}>
            <div className="row-between" style={{ marginBottom: 'var(--s-2)' }}>
              <p className="section-label">{cat.emoji ? `${cat.emoji} ` : ''}{cat.name}</p>
              <span className="small muted">{done}/{list.length}</span>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {list.map((item, idx) => {
                const on = checked.has(item.id);
                return (
                  <div
                    key={item.id}
                    className="row"
                    style={{
                      gap: 'var(--s-3)',
                      padding: '11px var(--s-4)',
                      borderTop: idx === 0 ? 'none' : '1px solid var(--border-soft)',
                    }}
                  >
                    <button
                      onClick={() => toggle(item.id)}
                      aria-label={on ? `Untick ${item.label}` : `Tick ${item.label}`}
                      style={{
                        flexShrink: 0, width: 24, height: 24, borderRadius: 7,
                        border: on ? '1.5px solid var(--green)' : '1.5px solid var(--border)',
                        background: on ? 'var(--green)' : 'transparent',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', padding: 0,
                      }}
                    >
                      {on && <Check size={15} strokeWidth={3} />}
                    </button>

                    {editing ? (
                      <input
                        className="input"
                        defaultValue={item.label}
                        onBlur={e => renameItem(item, e.target.value)}
                        style={{ flex: 1, padding: '6px 10px', minHeight: 0 }}
                      />
                    ) : (
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 500,
                          color: on ? 'var(--mute)' : 'inherit',
                          textDecoration: on ? 'line-through' : 'none',
                        }}>{item.label}</div>
                        {item.note && <div className="small muted" style={{ marginTop: 1 }}>{item.note}</div>}
                      </div>
                    )}

                    {editing && (
                      <button className="btn btn-ghost btn-sm" onClick={() => removeItem(item)} aria-label={`Delete ${item.label}`}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                );
              })}

              {editing && (
                <div className="row" style={{ gap: 'var(--s-2)', padding: '11px var(--s-4)', borderTop: list.length ? '1px solid var(--border-soft)' : 'none' }}>
                  <input
                    className="input"
                    placeholder="Add an item…"
                    value={newItem[cat.id] ?? ''}
                    onChange={e => setNewItem(prev => ({ ...prev, [cat.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') addItem(cat.id); }}
                    style={{ flex: 1, padding: '6px 10px', minHeight: 0 }}
                  />
                  <button className="btn btn-secondary btn-sm" onClick={() => addItem(cat.id)}><Plus size={14} /></button>
                  <button className="btn btn-ghost btn-sm" onClick={() => removeCategory(cat)} aria-label={`Delete ${cat.name}`}>
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {editing && (
        <div className="card">
          <p className="section-label" style={{ marginBottom: 'var(--s-2)' }}>New section</p>
          <div className="row" style={{ gap: 'var(--s-2)' }}>
            <input
              className="input"
              placeholder="e.g. Caddie Cash"
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addCategory(); }}
              style={{ flex: 1 }}
            />
            <button className="btn btn-secondary btn-sm" onClick={addCategory}><Plus size={14} />Add</button>
          </div>
        </div>
      )}

      <div className="card" style={{ background: 'rgba(201,162,75,.08)', borderColor: 'var(--gilt)' }}>
        <p style={{ fontWeight: 500 }}>🧳 One list, twelve bags</p>
        <p className="small muted" style={{ marginTop: 4 }}>
          Edits to the list are shared with everyone. Your ticks are private — no one sees whether you remembered the rain gloves.
        </p>
      </div>
    </div>
  );
}
