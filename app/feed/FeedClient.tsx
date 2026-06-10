'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Send, Camera, X, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { initials } from '@/lib/utils';
import type { Message, Photo, Player, Round } from '@/lib/types';

interface Props {
  messages: (Message & { players: Player })[];
  photos: (Photo & { players: Player; rounds: any })[];
  rounds: (Pick<Round, 'id' | 'round_no'> & { courses: any })[];
  myPlayerId: string | null;
  myName: string;
  isAdmin: boolean;
  supabaseUrl: string;
}

function Avatar({ player }: { player: Player }) {
  return (
    <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>
      {player.avatar_url
        ? <Image src={player.avatar_url} alt={player.name} width={36} height={36} />
        : <div className="avatar-initials" style={{ fontSize: '0.7rem', background: 'var(--cream-dark)' }}>{initials(player.name)}</div>
      }
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function FeedClient({ messages, photos, rounds, myPlayerId, myName, isAdmin, supabaseUrl }: Props) {
  const [body, setBody] = useState('');
  const [caption, setCaption] = useState('');
  const [roundId, setRoundId] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Merge and sort feed items
  const feedItems = [
    ...messages.map(m => ({ type: 'message' as const, id: m.id, created_at: m.created_at, data: m })),
    ...photos.map(p => ({ type: 'photo' as const, id: p.id, created_at: p.created_at, data: p })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  async function sendMessage() {
    if (!body.trim() || !myPlayerId) return;
    setSending(true);
    const supabase = createClient();
    await supabase.from('messages').insert({ author_id: myPlayerId, body: body.trim() });
    setBody('');
    setSending(false);
    router.refresh();
  }

  async function uploadPhoto() {
    if (!photoFile || !myPlayerId) return;
    setUploading(true);
    setUploadError(null);
    const supabase = createClient();
    const ext = photoFile.name.split('.').pop() ?? 'jpg';
    const path = `${myPlayerId}/${Date.now()}.${ext}`;
    const { error: storageError } = await supabase.storage.from('photos').upload(path, photoFile);
    if (storageError) {
      setUploadError(`Upload failed: ${storageError.message}`);
      setUploading(false);
      return;
    }
    const { error: dbError } = await supabase.from('photos').insert({
      uploader_id: myPlayerId,
      storage_path: path,
      caption: caption.trim() || null,
      round_id: roundId || null,
    });
    if (dbError) {
      setUploadError(`Save failed: ${dbError.message}`);
      setUploading(false);
      return;
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    setCaption('');
    setRoundId('');
    setUploading(false);
    router.refresh();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function deleteMessage(id: string) {
    const supabase = createClient();
    await supabase.from('messages').delete().eq('id', id);
    router.refresh();
  }

  async function deletePhoto(id: string, path: string) {
    const supabase = createClient();
    await supabase.storage.from('photos').remove([path]);
    await supabase.from('photos').delete().eq('id', id);
    router.refresh();
  }

  function getPhotoUrl(path: string): string {
    return `${supabaseUrl}/storage/v1/object/public/photos/${path}`;
  }

  return (
    <div style={{ paddingBottom: 'var(--s-6)' }}>
      {/* Compose area — hidden for viewer accounts (no player row) */}
      {myPlayerId && <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', padding: 'var(--s-3) var(--s-4)' }}>
        <div className="wrap">
          <div style={{ display: 'flex', gap: 'var(--s-2)', alignItems: 'flex-end' }}>
            <textarea
              className="input textarea"
              style={{ minHeight: 44, resize: 'none', flex: 1 }}
              placeholder="Post a message…"
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={2}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendMessage(); }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !body.trim()}
              className="btn btn-primary"
              style={{ minWidth: 44 }}
            >
              <Send size={16} />
            </button>
            <button onClick={() => fileRef.current?.click()} className="btn btn-secondary" style={{ minWidth: 44 }}>
              <Camera size={16} />
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

          {photoPreview && (
            <div style={{ marginTop: 'var(--s-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
              <div style={{ position: 'relative', height: 180 }}>
                <Image src={photoPreview} alt="Preview" fill style={{ objectFit: 'cover' }} />
                <button onClick={() => { setPhotoPreview(null); setPhotoFile(null); }} className="btn btn-ghost" style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.5)', color: '#fff' }}>
                  <X size={14} />
                </button>
              </div>
              <div style={{ padding: 'var(--s-3)' }} className="stack-sm">
                <input className="input" placeholder="Caption (optional)" value={caption} onChange={e => setCaption(e.target.value)} />
                <select className="select" value={roundId} onChange={e => setRoundId(e.target.value)}>
                  <option value="">Tag a round (optional)</option>
                  {rounds.map(r => <option key={r.id} value={r.id}>Round {r.round_no} — {r.courses?.name}</option>)}
                </select>
                <button onClick={uploadPhoto} disabled={uploading} className="btn btn-gilt btn-block">
                  <Camera size={14} />{uploading ? 'Uploading…' : 'Post Photo'}
                </button>
                {uploadError && <p style={{ color: '#c0392b', fontSize: '0.8rem', margin: 0 }}>{uploadError}</p>}
              </div>
            </div>
          )}
        </div>
      </div>}

      {/* Feed */}
      <div className="wrap" style={{ paddingTop: 'var(--s-4)' }}>
        {feedItems.length === 0 && (
          <div className="empty-state">
            <span style={{ fontSize: '2rem' }}>💬</span>
            <p>No posts yet. Be the first.</p>
          </div>
        )}
        <div className="stack">
          {feedItems.map(item => {
            if (item.type === 'message') {
              const m = item.data as Message & { players: Player };
              const canDelete = isAdmin || m.author_id === myPlayerId;
              return (
                <div key={item.id} className="card">
                  <div className="row-between" style={{ marginBottom: 'var(--s-2)' }}>
                    <div className="row" style={{ gap: 'var(--s-2)' }}>
                      <Avatar player={m.players} />
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.players?.name ?? 'Unknown'}</span>
                        <span className="small muted" style={{ marginLeft: 6 }}>{timeAgo(m.created_at)}</span>
                      </div>
                    </div>
                    {canDelete && (
                      <button onClick={() => deleteMessage(m.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--mute)' }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{m.body}</p>
                </div>
              );
            }
            const p = item.data as Photo & { players: Player; rounds: any };
            const canDelete = isAdmin || p.uploader_id === myPlayerId;
            return (
              <div key={item.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ position: 'relative', height: 240 }}>
                  <Image src={getPhotoUrl(p.storage_path)} alt={p.caption ?? ''} fill style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ padding: 'var(--s-3)' }}>
                  <div className="row-between">
                    <div className="row" style={{ gap: 'var(--s-2)' }}>
                      <Avatar player={p.players} />
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.players?.name}</span>
                        <span className="small muted" style={{ marginLeft: 6 }}>{timeAgo(p.created_at)}</span>
                      </div>
                    </div>
                    {canDelete && (
                      <button onClick={() => deletePhoto(p.id, p.storage_path)} className="btn btn-ghost btn-sm" style={{ color: 'var(--mute)' }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  {p.caption && <p style={{ marginTop: 'var(--s-2)', fontStyle: 'italic' }}>{p.caption}</p>}
                  {p.rounds && <span className="chip chip-neutral" style={{ marginTop: 'var(--s-1)' }}>Round {p.rounds.round_no} · {p.rounds.courses?.name}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
