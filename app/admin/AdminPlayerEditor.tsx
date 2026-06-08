'use client';

import { useRef, useState } from 'react';
import { Camera, Check, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { initials } from '@/lib/utils';
import type { Player } from '@/lib/types';
import AvatarCropModal from '@/components/AvatarCropModal';

interface AdminPlayer extends Player {
  currentEmail: string;
}

interface Props {
  players: AdminPlayer[];
}

interface FieldState {
  name: string;
  ghin: string;
  homeClub: string;
  bio: string;
  nickname: string;
  phone: string;
  team: string;
  email: string;
  password: string;
}

function makeFields(p: AdminPlayer): FieldState {
  return {
    name: p.name,
    ghin: p.ghin ?? '',
    homeClub: p.home_club ?? '',
    bio: p.bio ?? '',
    nickname: p.nickname ?? '',
    phone: p.phone ?? '',
    team: p.team,
    email: p.currentEmail,
    password: '',
  };
}

export default function AdminPlayerList({ players }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, FieldState>>(() =>
    Object.fromEntries(players.map(p => [p.id, makeFields(p)])),
  );
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>(() =>
    Object.fromEntries(players.map(p => [p.id, p.avatar_url ?? ''])),
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [pendingCrop, setPendingCrop] = useState<{ playerId: string; file: File } | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const setField = (playerId: string, key: keyof FieldState, val: string) =>
    setFields(prev => ({ ...prev, [playerId]: { ...prev[playerId], [key]: val } }));

  async function savePlayer(playerId: string) {
    setSaving(playerId);
    setErrors(prev => ({ ...prev, [playerId]: '' }));
    const f = fields[playerId];
    const res = await fetch('/api/admin/update-player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId,
        name: f.name,
        ghin: f.ghin,
        homeClub: f.homeClub,
        bio: f.bio,
        nickname: f.nickname,
        phone: f.phone,
        team: f.team,
        email: f.email,
        password: f.password || undefined,
      }),
    });
    const json = await res.json();
    setSaving(null);
    if (!res.ok) {
      setErrors(prev => ({ ...prev, [playerId]: json.error ?? 'Save failed' }));
    } else {
      setFields(prev => ({ ...prev, [playerId]: { ...prev[playerId], password: '' } }));
      setSaved(playerId);
      setTimeout(() => setSaved(s => (s === playerId ? null : s)), 2500);
    }
  }

  async function uploadCropped(playerId: string, blob: Blob) {
    setPendingCrop(null);
    setUploading(playerId);
    const form = new FormData();
    form.append('file', blob, 'avatar.jpg');
    const res = await fetch(`/api/upload-avatar?playerId=${playerId}`, { method: 'POST', body: form });
    const json = await res.json();
    setUploading(null);
    if (res.ok && json.avatarUrl) {
      setAvatarUrls(prev => ({ ...prev, [playerId]: json.avatarUrl + '?t=' + Date.now() }));
    } else {
      setErrors(prev => ({ ...prev, [playerId]: json.error ?? 'Photo upload failed' }));
    }
  }

  const teamColor = (t: string) => t === 'murray' ? 'var(--green)' : '#c94a2a';

  return (
    <>
      {pendingCrop && (
        <AvatarCropModal
          file={pendingCrop.file}
          onConfirm={blob => uploadCropped(pendingCrop.playerId, blob)}
          onCancel={() => setPendingCrop(null)}
        />
      )}

      <div className="stack">
        {players.map(p => {
          const isOpen = expanded === p.id;
          const f = fields[p.id];
          const avatarUrl = avatarUrls[p.id];
          const isSaving = saving === p.id;
          const isSaved = saved === p.id;
          const isUploading = uploading === p.id;
          const errMsg = errors[p.id];

          return (
            <div key={p.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Player row header */}
              <button
                onClick={() => setExpanded(isOpen ? null : p.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 'var(--s-3) var(--s-4)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <div className="avatar" style={{ width: 44, height: 44, flexShrink: 0, border: `2.5px solid ${teamColor(p.team)}` }}>
                  {avatarUrl
                    ? /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={avatarUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : <div className="avatar-initials" style={{ color: teamColor(p.team) }}>{initials(p.name)}</div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.2 }}>{p.name}</div>
                  <div className="small muted" style={{ marginTop: 1 }}>
                    {p.team === 'murray' ? 'Team Murray' : 'Team Harris'}{p.ghin ? ` · GHIN ${p.ghin}` : ''}
                  </div>
                </div>
                {isOpen ? <ChevronUp size={18} style={{ color: 'var(--mute)', flexShrink: 0 }} /> : <ChevronDown size={18} style={{ color: 'var(--mute)', flexShrink: 0 }} />}
              </button>

              {/* Expanded edit panel */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border-soft)', padding: 'var(--s-4)' }} className="stack">

                  {/* Photo */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="avatar" style={{ width: 64, height: 64, flexShrink: 0, border: `3px solid ${teamColor(p.team)}` }}>
                      {avatarUrl
                        ? /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={avatarUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : <div className="avatar-initials" style={{ fontSize: '1.1rem', color: teamColor(p.team) }}>{initials(p.name)}</div>
                      }
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={isUploading}
                      onClick={() => fileRefs.current[p.id]?.click()}
                    >
                      {isUploading ? <><Loader size={13} /> Uploading…</> : <><Camera size={13} /> Change Photo</>}
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      ref={el => { fileRefs.current[p.id] = el; }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) { e.target.value = ''; setPendingCrop({ playerId: p.id, file }); }
                      }}
                    />
                  </div>

                  {/* Profile fields */}
                  <label className="field">Full Name
                    <input className="input" value={f.name} onChange={e => setField(p.id, 'name', e.target.value)} />
                  </label>
                  <label className="field">Nickname
                    <input className="input" value={f.nickname} onChange={e => setField(p.id, 'nickname', e.target.value)} placeholder="e.g. Stumps" />
                  </label>
                  <label className="field">GHIN Number
                    <input className="input" value={f.ghin} onChange={e => setField(p.id, 'ghin', e.target.value)} placeholder="e.g. 1234567" />
                  </label>
                  <label className="field">Home Club
                    <input className="input" value={f.homeClub} onChange={e => setField(p.id, 'homeClub', e.target.value)} placeholder="e.g. Meadow Club" />
                  </label>
                  <label className="field">Phone
                    <input className="input" type="tel" value={f.phone} onChange={e => setField(p.id, 'phone', e.target.value)} />
                  </label>
                  <label className="field">Bio
                    <textarea className="textarea" value={f.bio} onChange={e => setField(p.id, 'bio', e.target.value)} rows={2} />
                  </label>
                  <label className="field">Team
                    <select className="input" value={f.team} onChange={e => setField(p.id, 'team', e.target.value)}>
                      <option value="murray">Team Murray</option>
                      <option value="harris">Team Harris</option>
                    </select>
                  </label>

                  {/* Auth section */}
                  <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 'var(--s-3)', marginTop: 'var(--s-1)' }}>
                    <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Login</p>
                    <div className="stack-sm">
                      <label className="field">Email
                        <input className="input" type="email" value={f.email} onChange={e => setField(p.id, 'email', e.target.value)} />
                      </label>
                      <label className="field">New Password
                        <input className="input" type="password" value={f.password} onChange={e => setField(p.id, 'password', e.target.value)} placeholder="Leave blank to keep current" />
                      </label>
                    </div>
                  </div>

                  {errMsg && (
                    <div style={{ background: 'rgba(180,30,30,0.08)', border: '1px solid rgba(180,30,30,0.2)', borderRadius: 8, padding: '8px 12px', color: '#a01818', fontSize: '0.82rem' }}>
                      {errMsg}
                    </div>
                  )}

                  <button
                    onClick={() => savePlayer(p.id)}
                    disabled={isSaving}
                    className={`btn btn-block ${isSaved ? 'btn-gilt' : 'btn-primary'}`}
                  >
                    {isSaved ? <><Check size={15} /> Saved!</> : isSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
