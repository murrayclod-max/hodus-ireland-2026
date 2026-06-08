'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  file: File;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

const SIZE = 280;

export default function AvatarCropModal({ file, onConfirm, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      const mz = SIZE / Math.min(image.naturalWidth, image.naturalHeight);
      setMinZoom(mz);
      setZoom(mz);
      setOffset({ x: 0, y: 0 });
      setImg(image);
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, SIZE, SIZE);

    ctx.save();
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    const w = img.naturalWidth * zoom;
    const h = img.naturalHeight * zoom;
    ctx.drawImage(img, SIZE / 2 - w / 2 + offset.x, SIZE / 2 - h / 2 + offset.y, w, h);
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }, [img, zoom, offset]);

  const startDrag = (x: number, y: number) =>
    (drag.current = { startX: x, startY: y, ox: offset.x, oy: offset.y });
  const moveDrag = (x: number, y: number) => {
    if (!drag.current) return;
    setOffset({ x: drag.current.ox + (x - drag.current.startX), y: drag.current.oy + (y - drag.current.startY) });
  };
  const endDrag = () => { drag.current = null; };

  const confirm = () =>
    canvasRef.current?.toBlob(blob => { if (blob) onConfirm(blob); }, 'image/jpeg', 0.92);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--cream)', borderRadius: 16, padding: 24, width: 'min(340px, 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>Crop Photo</div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--mute)', textAlign: 'center' }}>Drag to reposition · Slide to zoom</p>

        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          style={{ borderRadius: '50%', cursor: 'grab', touchAction: 'none', boxShadow: '0 0 0 4px var(--green)', maxWidth: '100%' }}
          onMouseDown={e => startDrag(e.clientX, e.clientY)}
          onMouseMove={e => moveDrag(e.clientX, e.clientY)}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchStart={e => { e.preventDefault(); startDrag(e.touches[0].clientX, e.touches[0].clientY); }}
          onTouchMove={e => { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY); }}
          onTouchEnd={endDrag}
        />

        <input
          type="range"
          min={minZoom}
          max={minZoom * 3}
          step={minZoom * 0.01}
          value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
          style={{ width: '100%' }}
        />

        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button onClick={onCancel} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
          <button onClick={confirm} className="btn btn-primary" style={{ flex: 1 }}>Use Photo</button>
        </div>
      </div>
    </div>
  );
}
