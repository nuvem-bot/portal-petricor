import Link from 'next/link';
import { loadClientProject } from '@/lib/client-project';
import { STAGES, stageIndex } from '@/lib/stages';
import { fmtDate } from '@/lib/url';

function nextStep(p, base) {
  const name = p.designer?.name?.split(' ')[0] || 'A designer';
  switch (p.stage) {
    case 'briefing':
      return p.briefingAt
        ? { who: 'estudio', h: 'Briefing recebido!', t: `${name} está lendo suas respostas e montando o moodboard.` }
        : { who: 'cliente', h: 'Comece contando sobre a sua marca.', t: 'São 8 perguntas rápidas. Você pode salvar e voltar depois.', cta: 'Responder briefing', href: `${base}/briefing` };
    case 'moodboard':
      return p.moodSentAt
        ? { who: 'estudio', h: 'Feedback recebido!', t: `${name} vai usar seus comentários para começar a criação.` }
        : { who: 'cliente', h: 'O moodboard está pronto.', t: 'Marque o que gostou e o que não gostou em cada imagem. Um comentário curto ajuda muito.', cta: 'Ver moodboard', href: `${base}/moodboard` };
    case 'criacao':
      return { who: 'estudio', h: `${name} está desenhando a sua marca.`, t: 'Nesta fase você não precisa fazer nada. Você recebe a proposta aqui.' };
    case 'proposta':
      return p.decision === 'ajustes'
        ? { who: 'estudio', h: 'Seus ajustes foram recebidos.', t: `A nova versão aparece aqui. Rodadas usadas: ${p.roundsUsed} de ${p.roundsIncluded}.`, cta: 'Ver pedido', href: `${base}/proposta` }
        : { who: 'cliente', h: 'A proposta da sua identidade está pronta.', t: 'Assista à apresentação com calma e depois diga se aprova ou se quer ajustes.', cta: 'Ver proposta', href: `${base}/proposta` };
    case 'finalizacao':
      return { who: 'estudio', h: 'Identidade aprovada!', t: `${name} está fechando o manual e os arquivos finais.` };
    default:
      return { who: 'cliente', h: 'Sua marca está pronta para usar.', t: 'Todos os arquivos estão disponíveis para baixar.', cta: 'Baixar arquivos', href: `${base}/entrega` };
  }
}

function stageDate(p, id) {
  return { briefing: p.briefingAt, moodboard: p.moodSentAt, proposta: p.decisionAt || p.proposalSentAt }[id];
}

export default async function ClientHome({ params }) {
  const p = await loadClientProject(params.token);
  const base = `/p/${p.token}`;
  const cur = stageIndex(p.stage);
  const n = nextStep(p, base);
  return (
    <>
      <div className="vhead">
        <div>
          <span className="label">Seu projeto de identidade visual</span>
          <h1>Oi, {p.clientName.split(' ')[0]}. Aqui está tudo da {p.brandName}.</h1>
          <p>Acompanhe cada etapa, responda a designer e veja a proposta, tudo num lugar só.</p>
        </div>
        <span className={`pill ${n.who === 'cliente' ? 'now' : 'ok'}`}>Etapa {cur + 1} de {STAGES.length} · {STAGES[cur].name}</span>
      </div>
      <div className="grid2">
        <div className="next">
          <span className="label">{n.who === 'cliente' ? 'Sua vez' : 'Com a Petricor'}</span>
          <h2>{n.h}</h2>
          <p>{n.t}</p>
          {n.cta && <Link className="btn" href={n.href}>{n.cta}</Link>}
        </div>
        <div className="panel">
          <span className="label">Linha do tempo</span>
          <ol className="timeline">
            {STAGES.map((s, i) => (
              <li key={s.id} className={i < cur ? 'is-done' : i === cur ? 'is-now' : ''}>
                <span className="dot">{i < cur ? '✓' : i + 1}</span>
                <div><b>{s.name}{i === cur && <span className="pill now" style={{ marginLeft: 8 }}>agora</span>}</b><small>{s.client}</small></div>
                <span className="when">{s.id === 'entrega' && p.dueDate && i > cur ? `prev. ${fmtDate(p.dueDate)}` : stageDate(p, s.id) ? fmtDate(stageDate(p, s.id)) : ''}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}
