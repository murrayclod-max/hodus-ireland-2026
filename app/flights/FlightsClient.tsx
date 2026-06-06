'use client';

import { useState } from 'react';
import { Plane, Plus, Pencil, X, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Flight, Player } from '@/lib/types';

interface Props {
  flights: (Flight & { players: Player })[];
  players: Pick<Player, 'id' | 'name' | 'first_name' | 'team'>[];
  myPlayerId: string | null;
  isAdmin: boolean;
}

function formatArrival(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function ArrivalSummary({ outFlights }: { outFlights: (Flight & { players: Player })[] }) {
  const withTimes = outFlights.filter(f => f.arrive_at).sort((a, b) =>
    new Date(a.arrive_at!).getTime() - new Date(b.arrive_at!).getTime()
  );
  if (withTimes.length === 0) return null;
  const first = withTimes[0];
  const last = withTimes[withTimes.length - 1];
  const spreadMs = new Date(last.arrive_at!).getTime() - new Date(first.arrive_at!).getTime();
  const spreadHrs = (spreadMs / 3600000).toFixed(1);

  return (
    <div className="card" style={{ background: 'rgba(201,162,75,.08)', borderColor: 'var(--gilt)' }}>
      <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Arrival Window</p>
      <div className="stack-sm">
        <div className="row-between">
          <span className="small muted">First in</span>
          <span style={{ fontWeight: 500 }}>{first.players?.first_name} — {formatArrival(first.arrive_at)}</span>
        </div>
        <div className="row-between">
          <span className="small muted">Driver waits for</span>
          <span style={{ fontWeight: 600, color: 'var(--green)' }}>{last.players?.first_name} — {formatArrival(last.arrive_at)}</span>
        </div>
        <div className="row-between">
          <span className="small muted">Total spread</span>
          <span style={{ fontWeight: 500 }}>{spreadHrs} hrs</span>
        </div>
      </div>
    </div>
  );
}

function FlightRow({ flight, canEdit, onEdit }: { flight: Flight & { players: Player }; canEdit: boolean; onEdit: () => void }) {
  const dir = flight.direction === 'out' ? '→ IRL' : '← Home';
  return (
    <div className="card">
      <div className="row-between">
        <div className="row" style={{ gap: 'var(--s-2)' }}>
          <Plane size={16} style={{ color: 'var(--mute)', flexShrink: 0, transform: flight.direction === 'return' ? 'scaleX(-1)' : undefined }} />
          <div>
            <div style={{ fontWeight: 600 }}>{flight.players?.name}</div>
            <div className="small muted">
              {flight.airline} {flight.flight_no} · {flight.from_code} → {flight.to_code}
            </div>
            {flight.arrive_at && <div className="small muted">Arrives {formatArrival(flight.arrive_at)}</div>}
            {flight.notes && <div className="small muted italic">{flight.notes}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', flexShrink: 0 }}>
          <span className={`chip ${flight.direction === 'out' ? 'chip-success' : 'chip-neutral'}`}>{dir}</span>
          {canEdit && <button onClick={onEdit} className="btn btn-ghost btn-sm" style={{ minWidth: 36 }}><Pencil size={14} /></button>}
        </div>
      </div>
    </div>
  );
}

function FlightForm({ flight, players, myPlayerId, isAdmin, onClose }: {
  flight?: Flight & { players: Player };
  players: Props['players'];
  myPlayerId: string | null;
  isAdmin: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [playerId, setPlayerId] = useState(flight?.player_id ?? myPlayerId ?? '');
  const [direction, setDirection] = useState<'out' | 'return'>(flight?.direction ?? 'out');
  const [airline, setAirline] = useState(flight?.airline ?? '');
  const [flightNo, setFlightNo] = useState(flight?.flight_no ?? '');
  const [from, setFrom] = useState(flight?.from_code ?? '');
  const [to, setTo] = useState(flight?.to_code ?? '');
  const [arriveAt, setArriveAt] = useState(flight?.arrive_at ? new Date(flight.arrive_at).toISOString().slice(0,16) : '');
  const [notes, setNotes] = useState(flight?.notes ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      player_id: playerId,
      direction,
      airline: airline || null,
      flight_no: flightNo || null,
      from_code: from || null,
      to_code: to || null,
      arrive_at: arriveAt ? new Date(arriveAt).toISOString() : null,
      notes: notes || null,
    };
    if (flight?.id) {
      await supabase.from('flights').update(payload).eq('id', flight.id);
    } else {
      await supabase.from('flights').insert(payload);
    }
    setSaving(false);
    onClose();
    router.refresh();
  }

  const canChangePlayer = isAdmin || !flight;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
      <div className="card card-lg" style={{ width: '100%', borderRadius: 'var(--r-xl) var(--r-xl) 0 0', paddingBottom: 'calc(var(--s-6) + env(safe-area-inset-bottom))' }}>
        <div className="row-between" style={{ marginBottom: 'var(--s-4)' }}>
          <h3>{flight ? 'Edit Flight' : 'Add Flight'}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm"><X size={18} /></button>
        </div>
        <div className="stack">
          {canChangePlayer && (
            <label className="field">Player
              <select className="select" value={playerId} onChange={e => setPlayerId(e.target.value)}>
                <option value="">Select player…</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
          )}
          <label className="field">Direction
            <select className="select" value={direction} onChange={e => setDirection(e.target.value as 'out' | 'return')}>
              <option value="out">Outbound (to Ireland)</option>
              <option value="return">Return (home)</option>
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-3)' }}>
            <label className="field">Airline<input className="input" value={airline} onChange={e => setAirline(e.target.value)} placeholder="Aer Lingus" /></label>
            <label className="field">Flight #<input className="input" value={flightNo} onChange={e => setFlightNo(e.target.value)} placeholder="EI 104" /></label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-3)' }}>
            <label className="field">From<input className="input" value={from} onChange={e => setFrom(e.target.value)} placeholder="JFK" /></label>
            <label className="field">To<input className="input" value={to} onChange={e => setTo(e.target.value)} placeholder="DUB" /></label>
          </div>
          <label className="field">Arrival (local time)
            <input className="input" type="datetime-local" value={arriveAt} onChange={e => setArriveAt(e.target.value)} />
          </label>
          <label className="field">Notes<input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Terminal 1, bag claim C…" /></label>
          <button className="btn btn-primary" onClick={save} disabled={saving || !playerId}>
            <Check size={16} />{saving ? 'Saving…' : 'Save Flight'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FlightsClient({ flights, players, myPlayerId, isAdmin }: Props) {
  const [editFlight, setEditFlight] = useState<(Flight & { players: Player }) | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const outFlights = flights.filter(f => f.direction === 'out');
  const returnFlights = flights.filter(f => f.direction === 'return');

  function canEdit(flight: Flight & { players: Player }) {
    return isAdmin || flight.player_id === myPlayerId;
  }

  return (
    <div className="wrap stack-lg" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-6)' }}>
      <ArrivalSummary outFlights={outFlights} />

      <div>
        <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Outbound to Ireland</p>
        <div className="stack-sm">
          {outFlights.length === 0
            ? <p className="muted small center">No outbound flights entered yet.</p>
            : outFlights.map(f => <FlightRow key={f.id} flight={f} canEdit={canEdit(f)} onEdit={() => setEditFlight(f)} />)
          }
        </div>
      </div>

      <div>
        <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Return Home</p>
        <div className="stack-sm">
          {returnFlights.length === 0
            ? <p className="muted small center">No return flights entered yet.</p>
            : returnFlights.map(f => <FlightRow key={f.id} flight={f} canEdit={canEdit(f)} onEdit={() => setEditFlight(f)} />)
          }
        </div>
      </div>

      <button onClick={() => setShowAdd(true)} className="btn btn-secondary btn-block">
        <Plus size={16} /> Add My Flight
      </button>

      {editFlight && (
        <FlightForm flight={editFlight} players={players} myPlayerId={myPlayerId} isAdmin={isAdmin} onClose={() => setEditFlight(null)} />
      )}
      {showAdd && (
        <FlightForm players={players} myPlayerId={myPlayerId} isAdmin={isAdmin} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}
