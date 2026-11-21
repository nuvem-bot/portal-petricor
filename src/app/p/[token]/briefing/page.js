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
  return (
    <>
      <div className="vhead">
        <div><span className="label">Etapa 1 · Briefing</span><h1>Conte sobre a sua marca</h1><p>Responda com o que vier na cabeça. Dá para salvar um rascunho e voltar depois.</p></div>
        <span className={`pill ${p.briefingAt ? 'ok' : 'now'}`}>{p.briefingAt ? `Enviado em ${fmtDate(p.briefingAt)}` : 'Aguardando você'}</span>
      </div>
      <div className="panel" style={{ maxWidth: 760 }}>
        <StateForm action={saveBriefing}>
          <input type="hidden" name="token" value={p.token} />
          {QUESTIONS.map((q) => (
            <div className="field" key={q.id}>
              {q.type === 'chips' ? <span>{q.label}</span> : <label htmlFor={`q-${q.id}`}>{q.label}{q.required && ' *'}</label>}
              {q.hint && <span className="hint">{q.hint}</span>}
              {q.type === 'text' && <input id={`q-${q.id}`} name={q.id} defaultValue={a[q.id] || ''} />}
              {q.type === 'textarea' && <textarea id={`q-${q.id}`} name={q.id} defaultValue={a[q.id] || ''} />}
              {q.type === 'chips' && (
                <div className="chips">
                  {q.options.map((o) => (
                    <label key={o}><input type="checkbox" name={q.id} value={o} defaultChecked={(a[q.id] || []).includes(o)} /><span>{o}</span></label>
                  ))}
                </div>
              )}
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
