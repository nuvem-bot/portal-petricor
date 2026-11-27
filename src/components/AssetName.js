'use client';
import { useRef, useState } from 'react';
import { renameAsset } from '@/lib/actions-studio';

// Nome do arquivo editável: clique, troque e aperte Enter (ou clique fora).
// Esc desfaz.
export default function AssetName({ id, label }) {
  const form = useRef(null);
  const cancel = useRef(false);
  const [value, setValue] = useState(label);
  const save = () => {
    if (cancel.current) { cancel.current = false; setValue(label); return; }
    const v = value.trim();
    if (!v) { setValue(label); return; }
    if (v !== label) form.current?.requestSubmit();
  };
  const key = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
    if (e.key === 'Escape') { cancel.current = true; e.currentTarget.blur(); }
  };
  return (
    <form ref={form} action={renameAsset} className="asset-name">
      <input type="hidden" name="assetId" value={id} />
      <input name="label" value={value} maxLength={120} aria-label="Nome do arquivo" title="Clique para renomear"
        onChange={(e) => setValue(e.target.value)} onBlur={save} onKeyDown={key} />
    </form>
  );
}
