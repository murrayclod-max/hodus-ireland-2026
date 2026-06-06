'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, Check, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { initials } from '@/lib/utils';
import type { Player } from '@/lib/types';

export default function ProfileEditor({ player, userId }: { player: Player; userId: string }) {
  const [bio, setBio] = useState(player.bio ?? '');
  const [nickname, setNickname] = useState(player.nickname ?? '');
  const [homeClub, setHomeClub] = useState(player.home_club ?? '');
  const [phone, setPhone] = useState(player.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState(player.avatar_url ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function uploadAvatar(file: File) {
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `avatars/${player.id}.${ext}`;
    const { error } = await supabase.storage.from('photos').upload(path, file, { upsert: true });
    if (!error) {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${path}`;
      setAvatarUrl(url);
      await supabase.from('players').update({ avatar_url: url }).eq('id', player.id);
    }
    setUploading(false);
    router.refresh();
  }

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from('players').update({
      bio: bio.trim() || null,
      nickname: nickname.trim() || null,
      home_club: homeClub.trim() || null,
      phone: phone.trim() || null,
    }).eq('id', player.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  return (
    <div className="stack-lg">
      {/* Avatar */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-4)' }}>
        <div className="avatar" style={{ width: 72, height: 72, position: 'relative' }}>
          {avatarUrl
            ? <Image src={avatarUrl} alt={player.name} width={72} height={72} />
            : <div className="avatar-initials" style={{ fontSize: '1.3rem' }}>{initials(player.name)}</div>
          }
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>{player.name}</div>
          <div className="small muted" style={{ marginBottom: 'var(--s-2)' }}>
            {player.team === 'murray' ? 'Team Murray' : 'Team Harris'} · {player.handicap_index ?? '—'} index
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn btn-secondary btn-sm"
          >
            <Camera size={14} />{uploading ? 'Uploading…' : 'Change Photo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
        </div>
      </div>

      {/* Edit fields */}
      <div className="card">
        <p className="section-label" style={{ marginBottom: 'var(--s-4)' }}>Edit Profile</p>
        <div className="stack">
          <label className="field">Nickname
            <input className="input" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="e.g. Stumps" />
          </label>
          <label className="field">Bio
            <textarea className="textarea" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell the lads something…" />
          </label>
          <label className="field">Home Club
            <input className="input" value={homeClub} onChange={e => setHomeClub(e.target.value)} placeholder="e.g. Meadow Club" />
          </label>
          <label className="field">Phone (for the group)
            <input className="input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
          </label>
          <button onClick={save} disabled={saving} className={`btn btn-block ${saved ? 'btn-gilt' : 'btn-primary'}`}>
            {saved ? <><Check size={16} /> Saved!</> : saving ? 'Saving…' : <><Pencil size={14} /> Save Profile</>}
          </button>
        </div>
      </div>

      {/* Read-only stats */}
      <div className="card">
        <p className="section-label" style={{ marginBottom: 'var(--s-3)' }}>Stats (read-only)</p>
        <div className="stack-sm">
          <div className="row-between"><span className="muted small">Handicap Index</span><strong>{player.handicap_index ?? '—'}</strong></div>
          <div className="row-between"><span className="muted small">GHIN</span><strong>{player.ghin ?? '—'}</strong></div>
          <div className="row-between"><span className="muted small">Team</span><strong>{player.team === 'murray' ? 'Murray' : 'Harris'}</strong></div>
          {player.is_captain && <div className="chip chip-gilt">Captain</div>}
          {player.is_admin && <div className="chip chip-success">Admin</div>}
        </div>
      </div>
    </div>
  );
}
