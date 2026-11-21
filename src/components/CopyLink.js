'use client';
import { useState } from 'react';

export default function CopyLink({ url }) {
  const [done, setDone] = useState(false);
  return (
    <div className="copy">
      <input className="input" readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Link da cliente" />
      <button type="button" className="btn sm" onClick={async () => {
        try { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 2000); } catch {}
      }}>{done ? 'Copiado' : 'Copiar'}</button>
    </div>
  );
}
