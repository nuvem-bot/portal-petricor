'use client';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveMoodNote, sendMood } from '@/lib/actions-client';

export default function MoodBoard({ token, items: initial, locked }) {
  const [items, setItems] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [msg, setMsg] = useState(null);
  const [tried, setTried] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const [zoom, setZoom] = useState(null); // índice da imagem ampliada

  useEffect(() => {
    if (zoom === null) return;
    const key = (e) => {
      if (e.key === 'Escape') { setZoom(null); return; }
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') setZoom((z) => (z + 1) % items.length);
      if (e.key === 'ArrowLeft') setZoom((z) => (z - 1 + items.length) % items.length);
    };
    window.addEventListener('keydown', key);
    document.documentElement.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', key); document.documentElement.style.overflow = ''; };
  }, [zoom, items.length]);

  const edit = (id, field, value) => setItems((all) => all.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

  function persist(item, field) {
    const prev = saved.find((s) => s.id === item.id);
    if (prev && prev[field] === item[field]) return Promise.resolve();
    const fd = new FormData();
    fd.set('token', token); fd.set('itemId', item.id); fd.set(field, item[field]);
    return saveMoodNote(fd)
      .then(() => setSaved((all) => all.map((s) => (s.id === item.id ? { ...s, [field]: item[field] } : s))))
      .catch(() => setMsg({ error: 'Não consegui salvar. Confira sua conexão.' }));
  }

  const complete = (i) => i.liked.trim() && i.disliked.trim();
  const done = items.filter(complete).length;

  return (
    <>
      <div className="mood">
        {items.map((m, idx) => {
          const ok = complete(m);
          const miss = tried && !ok;
          return (
            <article key={m.id} className={`tile ${ok ? 'liked' : miss ? 'disliked' : ''}`}>
              <button type="button" className="img zoomable" onClick={() => setZoom(idx)} aria-label={`Ampliar referência ${idx + 1}`}>
                <img src={m.src} alt={m.caption || `Referência ${idx + 1}`} loading="lazy" />
                <span className="zoom-hint" aria-hidden="true">⤢ ampliar</span>
              </button>
              <div className="tbody">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="label">{String(idx + 1).padStart(2, '0')}{m.caption ? ` · ${m.caption}` : ''}</span>
                  {ok && <span className="pill ok">ok</span>}
                </div>
                <label className="small" htmlFor={`l-${m.id}`} style={{ fontWeight: 600, color: 'var(--ok)' }}>Gostei de…</label>
                <textarea id={`l-${m.id}`} value={m.liked} disabled={locked} required placeholder="Ex.: da cor, da fonte"
                  onChange={(e) => edit(m.id, 'liked', e.target.value)} onBlur={() => persist(m, 'liked')}
                  aria-invalid={miss && !m.liked.trim()} />
                <label className="small" htmlFor={`d-${m.id}`} style={{ fontWeight: 600, color: 'var(--bad)' }}>Não gostei de…</label>
                <textarea id={`d-${m.id}`} value={m.disliked} disabled={locked} required placeholder="Ex.: da textura"
                  onChange={(e) => edit(m.id, 'disliked', e.target.value)} onBlur={() => persist(m, 'disliked')}
                  aria-invalid={miss && !m.disliked.trim()} />
              </div>
            </article>
          );
        })}
      </div>
      {!locked && (
        <div className="stickybar">
          <span className="small">{done} de {items.length} imagens comentadas</span>
          <button className="btn primary" type="button" disabled={pending} onClick={() => start(async () => {
            setTried(true);
            await Promise.all(items.flatMap((i) => [persist(i, 'liked'), persist(i, 'disliked')]));
            const fd = new FormData(); fd.set('token', token);
            const r = await sendMood(fd);
            setMsg(r);
            if (r?.ok) router.refresh();
          })}>{pending ? 'Enviando…' : 'Enviar'}</button>
        </div>
      )}
      {msg?.error && <p className="msg-err" role="alert" style={{ marginTop: 12 }}>{msg.error}</p>}
      {zoom !== null && (() => {
        const m = items[zoom];
        const go = (d) => setZoom((zoom + d + items.length) % items.length);
        return (
          <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Referência ${zoom + 1} de ${items.length}`}>
            <div className="lb-top">
              <span>{String(zoom + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}{m.caption ? ` · ${m.caption}` : ''}</span>
              <button type="button" className="lb-close" aria-label="Fechar" onClick={() => setZoom(null)}>Fechar ✕</button>
            </div>
            <div className="lb-stage" onClick={() => setZoom(null)}>
              <img src={m.src} alt={m.caption || `Referência ${zoom + 1}`} onClick={(e) => e.stopPropagation()} />
              {items.length > 1 && <>
                <button type="button" className="lb-nav prev" aria-label="Imagem anterior" onClick={(e) => { e.stopPropagation(); go(-1); }}>‹</button>
                <button type="button" className="lb-nav next" aria-label="Próxima imagem" onClick={(e) => { e.stopPropagation(); go(1); }}>›</button>
              </>}
            </div>
            <aside className="lb-side">
              <label htmlFor={`zl-${m.id}`} style={{ color: '#7FD6A6' }}>Gostei de…</label>
              <textarea id={`zl-${m.id}`} value={m.liked} disabled={locked} placeholder="Ex.: da cor, da fonte"
                onChange={(e) => edit(m.id, 'liked', e.target.value)} onBlur={() => persist(m, 'liked')}
                onKeyDown={(e) => e.stopPropagation()} />
              <label htmlFor={`zd-${m.id}`} style={{ color: '#F29C9C' }}>Não gostei de…</label>
              <textarea id={`zd-${m.id}`} value={m.disliked} disabled={locked} placeholder="Ex.: da textura"
                onChange={(e) => edit(m.id, 'disliked', e.target.value)} onBlur={() => persist(m, 'disliked')}
                onKeyDown={(e) => e.stopPropagation()} />
              <span className="lb-count">{complete(m) ? 'Imagem comentada ✓' : 'Escreva nos dois campos'} · {done} de {items.length}</span>
            </aside>
          </div>
        );
      })()}
      {locked && <p className="msg-ok" style={{ marginTop: 20 }}>Feedback enviado. Obrigado! A designer já está usando seus comentários.</p>}
    </>
  );
}
