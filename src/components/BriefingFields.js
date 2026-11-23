import { QUESTIONS } from '@/lib/briefing';

// Campos do briefing, usados no link do cliente e no painel (quando a designer sobe um briefing que já existe)
export default function BriefingFields({ answers: a, prefix = 'q' }) {
  return QUESTIONS.map((q) => (
    <div key={q.id} className="form" style={{ gap: 0 }}>
      {q.section && <h2 style={{ fontSize: 20, margin: '12px 0 14px', paddingTop: 12, borderTop: '1px solid var(--line)' }}>{q.section}</h2>}
      <div className="field">
        {['chips', 'radio'].includes(q.type) ? <span>{q.label}{q.required && ' *'}</span> : <label htmlFor={`${prefix}-${q.id}`}>{q.label}{q.required && ' *'}</label>}
        {(q.hint || q.max) && <span className="hint">{q.hint || ''}{q.type === 'chips' && q.max < q.options.length ? `${q.hint ? ' ' : ''}Escolha até ${q.max}.` : ''}</span>}
        {['text', 'email'].includes(q.type) && <input id={`${prefix}-${q.id}`} name={q.id} type={q.type} defaultValue={a[q.id] || ''} />}
        {q.type === 'textarea' && <textarea id={`${prefix}-${q.id}`} name={q.id} defaultValue={a[q.id] || ''} />}
        {['chips', 'radio'].includes(q.type) && (
          <div className="chips" role={q.type === 'radio' ? 'radiogroup' : 'group'} aria-label={q.label}>
            {q.options.map((o) => (
              <label key={o}>
                <input type={q.type === 'radio' ? 'radio' : 'checkbox'} name={q.id} value={o}
                  defaultChecked={q.type === 'radio' ? a[q.id] === o : (a[q.id] || []).includes(o)} />
                <span>{o}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  ));
}
