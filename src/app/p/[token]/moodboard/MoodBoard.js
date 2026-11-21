'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { reactMood, sendMood } from '@/lib/actions-client';

export default function MoodBoard({ token, items: initial, locked }) {
  const [items, setItems] = useState(initial);
  const [msg, setMsg] = useState(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function save(item, patch) {
    const next = { ...item, ...patch };
    setItems((all) => all.map((i) => (i.id === item.id ? next : i)));
    const fd = new FormData();
    fd.set('token', token); fd.set('itemId', item.id); fd.set('reaction', next.reaction || '');
    if ('comment' in patch) fd.set('comment', next.comment || '');
    reactMood(fd).catch(() => setMsg({ error: 'Não consegui salvar. Confira sua conexão.' }));
  }

  const done = items.filter((i) => i.reaction).length;
  const liked = items.filter((i) => i.reaction === 'gostei').length;

  return (
    <>
      <div className="mood">
        {items.map((m, idx) => (
          <article key={m.id} className={`tile ${m.reaction === 'gostei' ? 'liked' : m.reaction === 'nao' ? 'disliked' : ''}`}>
            <div className="img"><img src={m.src} alt={m.caption || `Referência ${idx + 1}`} loading="lazy" /></div>
            <div className="tbody">
              {m.caption && <p className="small muted">{m.caption}</p>}
              <div className="react">
                <button type="button" className="yes" disabled={locked} aria-pressed={m.reaction === 'gostei'} onClick={() => save(m, { reaction: m.reaction === 'gostei' ? null : 'gostei' })}>Gostei</button>
                <button type="button" className="no" disabled={locked} aria-pressed={m.reaction === 'nao'} onClick={() => save(m, { reaction: m.reaction === 'nao' ? null : 'nao' })}>Não gostei</button>
              </div>
              <label className="small" htmlFor={`c-${m.id}`}>Por quê?</label>
              <textarea id={`c-${m.id}`} defaultValue={m.comment || ''} disabled={locked} placeholder="Opcional"
                onBlur={(e) => { if (e.target.value !== (m.comment || '')) save(m, { comment: e.target.value }); }} />
            </div>
          </article>
        ))}
      </div>
      {!locked && (
        <div className="stickybar">
          <span className="small">{done ? `${liked} gostei · ${done - liked} não gostei · faltam ${items.length - done}` : 'Responda as imagens para enviar.'}</span>
          <button className="btn primary" type="button" disabled={pending} onClick={() => start(async () => {
            const fd = new FormData(); fd.set('token', token);
            const r = await sendMood(fd);
            setMsg(r);
            if (r?.ok) router.refresh();
          })}>{pending ? 'Enviando…' : 'Enviar para a designer'}</button>
        </div>
      )}
      {msg?.error && <p className="msg-err" role="alert" style={{ marginTop: 12 }}>{msg.error}</p>}
      {locked && <p className="msg-ok" style={{ marginTop: 20 }}>Feedback enviado. Obrigado! A designer já está usando seus comentários.</p>}
    </>
  );
}
