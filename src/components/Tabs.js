'use client';
import { Children, useEffect, useState } from 'react';

// Abas simples. Os painéis escondidos continuam no formulário (os campos são enviados juntos).
export default function Tabs({ tabs, storageKey, children }) {
  const [cur, setCur] = useState(tabs[0].id);
  useEffect(() => {
    try { const v = sessionStorage.getItem(storageKey); if (v && tabs.some((t) => t.id === v)) setCur(v); } catch {}
  }, [storageKey, tabs]);
  const pick = (id) => { setCur(id); try { sessionStorage.setItem(storageKey, id); } catch {} };
  const panels = Children.toArray(children);
  return (
    <div className="tabs">
      <div className="tabbar" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={cur === t.id} className={cur === t.id ? 'on' : ''} onClick={() => pick(t.id)}>
            {t.label}{t.done ? <span className="tdot" aria-label="preenchido" /> : null}
          </button>
        ))}
      </div>
      {panels.map((p, i) => (
        <div key={tabs[i].id} role="tabpanel" hidden={cur !== tabs[i].id} className="tabpanel">{p}</div>
      ))}
    </div>
  );
}
