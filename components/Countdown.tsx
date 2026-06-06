'use client';

import { useEffect, useState } from 'react';

interface Props {
  targetDate: string;
  endDate: string;
}

export default function Countdown({ targetDate, endDate }: Props) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    function update() {
      const now = new Date();
      const start = new Date(targetDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');

      if (now >= end) {
        setDisplay('The trip is over. What a week.');
        return;
      }
      if (now >= start) {
        setDisplay("🏌️ We're on the ground in Ireland!");
        return;
      }

      const diff = start.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hrs  = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setDisplay(`${days}d ${hrs}h ${mins}m to tee time`);
    }
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [targetDate, endDate]);

  if (!display) return null;

  return (
    <div style={{
      background: 'rgba(255,255,255,.1)',
      borderRadius: 'var(--r-md)',
      padding: '8px 14px',
      display: 'inline-block',
      fontSize: '0.88rem',
      color: 'rgba(255,255,255,.9)',
      fontVariantNumeric: 'tabular-nums',
    }}>
      ⏱ {display}
    </div>
  );
}
