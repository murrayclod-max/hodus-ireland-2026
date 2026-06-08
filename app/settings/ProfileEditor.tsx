'use client';

import { useState, useRef } from 'react';
import { Camera, Check, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { initials } from '@/lib/utils';
import type { Player } from '@/lib/types';
import AvatarCropModal from '@/components/AvatarCropModal';

export default function ProfileEditor({ player, userId }: { player: Player; userId: string }) {
  const [bio, setBio] = useState(player.bio ?? '');
  const [nickname, setNickname] = useState(player.nickname ?? '');
  const [homeClub, setHomeClub] = useState(player.home_club ?? '');
  const [phone, setPhone] = useState(player.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState(player.avatar_url ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [saved, setSaved] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function uploadCropped(blob: Blob) {
    setPendingFile(null);
    setUploading(true);
    setUploadErr('');
    const form = new FormData();
    form.append('file', blob, 'avatar.jpg');
    const res = await fetch('/api/upload-avatar', { method: 'POST', body: form });
    const json = await res.json();
    if (!res.ok || !json.avatarUrl) {
      setUploadErr(json.error ?? 'Upload failed');
    } else {
      setAvatarUrl(json.avatarUrl + '?t=' + Date.now());
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
    <>
      {pendingFile && (
        <AvatarCropModal
          file={pendingFile}
          onConfirm={uploadCropped}
          onCancel={() => setPendingFile(null)}
        />
      )}

      <div className="stack-lg">
        {/* Avatar */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-4)' }}>
          <div className="avatar" style={{ width: 72, height: 72, position: 'relative', flexShrink: 0 }}>
            {avatarUrl
              ? /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatarUrl} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
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
            {uploadErr && <p style={{ color: 'red', fontSize: '0.78rem', marginTop: 4 }}>{uploadErr}</p>}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) { e.target.value = ''; setPendingFile(f); } }} />
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
    </>
  );
}
