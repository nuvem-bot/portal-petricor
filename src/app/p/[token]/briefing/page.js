import { loadClientProject } from '@/lib/client-project';
import { QUESTIONS, parseBriefing } from '@/lib/briefing';
import { saveBriefing } from '@/lib/actions-client';
import { fmtDate } from '@/lib/url';
import StateForm from '@/components/StateForm';
import Submit from '@/components/Submit';

export default async function Briefing({ params }) {
  const p = await loadClientProject(params.token);
  const a = parseBriefing(p.briefing);
  if (!a.marca) a.marca = p.brandName;
  if (!a.nome) a.nome = p.clientName;
  if (!a.email && p.clientEmail) a.email = p.clientEmail;
  return (
    <>
      <div className="vhead">
        <div><span className="label">Etapa 1 · Briefing</span><h1>Conte sobre a sua marca</h1><p>Responda com o que vier na cabeça. Dá para salvar um rascunho e voltar depois. As perguntas com * são obrigatórias.</p></div>
        <span className={`pill ${p.briefingAt ? 'ok' : 'now'}`}>{p.briefingAt ? `Enviado em ${fmtDate(p.briefingAt)}` : 'Aguardando você'}</span>
      </div>
      <div className="panel" style={{ maxWidth: 760 }}>
        <StateForm action={saveBriefing}>
          <input type="hidden" name="token" value={p.token} />
          {QUESTIONS.map((q) => (
            <div key={q.id} className="form" style={{ gap: 0 }}>
              {q.section && <h2 style={{ fontSize: 20, margin: '12px 0 14px', paddingTop: 12, borderTop: '1px solid var(--line)' }}>{q.section}</h2>}
              <div className="field">
                {['chips', 'radio'].includes(q.type) ? <span>{q.label}{q.required && ' *'}</span> : <label htmlFor={`q-${q.id}`}>{q.label}{q.required && ' *'}</label>}
                {(q.hint || q.max) && <span className="hint">{q.hint || ''}{q.type === 'chips' && q.max < q.options.length ? `${q.hint ? ' ' : ''}Escolha até ${q.max}.` : ''}</span>}
                {['text', 'email'].includes(q.type) && <input id={`q-${q.id}`} name={q.id} type={q.type} defaultValue={a[q.id] || ''} />}
                {q.type === 'textarea' && <textarea id={`q-${q.id}`} name={q.id} defaultValue={a[q.id] || ''} />}
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
          ))}
          <div className="row">
            <Submit name="enviar" value="1" pendingText="Enviando…">{p.briefingAt ? 'Atualizar respostas' : 'Enviar briefing'}</Submit>
            <Submit className="btn ghost" name="enviar" value="0">Salvar rascunho</Submit>
          </div>
        </StateForm>
      </div>
    </>
  );
}
