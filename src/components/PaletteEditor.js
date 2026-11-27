'use client';
import { useState } from 'react';

// 4 cores básicas + botão para adicionar mais (até `max`)
export default function PaletteEditor({ initial, max, form }) {
  const [rows, setRows] = useState(initial.map((c, i) => ({ ...c, key: i })));
  const set = (k, field, v) => setRows((r) => r.map((x) => (x.key === k ? { ...x, [field]: v } : x)));
  return (
    <div className="stack" style={{ gap: 8 }}>
      {rows.map((c, i) => (
        <div className="swrow" key={c.key}>
          <input type="color" form={form} name={`ch${i}`} value={c.hex} onChange={(e) => set(c.key, 'hex', e.target.value)} aria-label={`Cor ${i + 1}`} />
          <input className="input" form={form} name={`cn${i}`} defaultValue={c.name} placeholder={i < 4 ? ['Cor principal', 'Cor de fundo', 'Cor de destaque', 'Cor de apoio'][i] : 'Nome da cor'} aria-label={`Nome da cor ${i + 1}`} />
          <span className="when">{c.hex.toUpperCase()}</span>
          <input className="input" form={form} name={`cd${i}`} defaultValue={c.note} placeholder="Onde usar" aria-label={`Uso da cor ${i + 1}`} />
          {i >= 4 && <button type="button" className="linkbtn" onClick={() => setRows((r) => r.filter((x) => x.key !== c.key))} aria-label={`Tirar cor ${i + 1}`}>Tirar</button>}
        </div>
      ))}
      {rows.length < max && (
        <div><button type="button" className="btn sm ghost" onClick={() => setRows((r) => [...r, { key: Date.now(), hex: '#888888', name: '', note: '' }])}>+ Adicionar cor</button></div>
      )}
    </div>
  );
}
