import { loadClientProject } from '@/lib/client-project';
import { parseBriefing } from '@/lib/briefing';
import BriefingFields from '@/components/BriefingFields';
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
          <BriefingFields answers={a} />
          <div className="row">
            <Submit name="enviar" value="1" pendingText="Enviando…">{p.briefingAt ? 'Atualizar respostas' : 'Enviar'}</Submit>
            <Submit className="btn ghost" name="enviar" value="0">Salvar rascunho</Submit>
          </div>
        </StateForm>
      </div>
    </>
  );
}
