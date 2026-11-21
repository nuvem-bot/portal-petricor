import Link from 'next/link';
import { db } from '@/lib/db';
import { requireDesigner } from '@/lib/auth';
import { STAGES, whoActs, stageName } from '@/lib/stages';
import { fmtDate, fmtDateTime } from '@/lib/url';
import NewProject from './NewProject';

function note(p) {
  switch (p.stage) {
    case 'briefing': return p.briefingAt ? 'Briefing respondido' : 'Aguardando briefing';
    case 'moodboard': return p.moodSentAt ? 'Feedback do moodboard chegou' : `Moodboard com a cliente`;
    case 'criacao': return 'Em criação';
    case 'proposta': return p.decision === 'ajustes' ? 'Cliente pediu ajustes' : 'Aguardando aprovação';
    case 'finalizacao': return 'Aprovada, finalizando';
    default: return 'Entregue';
  }
}

export default async function Dashboard() {
  const me = await requireDesigner();
  const projects = await db.project.findMany({ orderBy: { updatedAt: 'desc' } });
  const events = await db.event.findMany({ orderBy: { createdAt: 'desc' }, take: 12, include: { project: { select: { id: true, brandName: true } } } });
  const active = projects.filter((p) => p.stage !== 'entrega');
  const mine = active.filter((p) => whoActs(p) === 'estudio');
  const theirs = active.filter((p) => whoActs(p) === 'cliente');
  const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
  const dueSoon = active.filter((p) => p.dueDate && new Date(p.dueDate) - Date.now() < 7 * 864e5).length;

  return (
    <>
      <div className="vhead">
        <div>
          <span className="label">Painel do estúdio</span>
          <h1>Oi, {me.name.split(' ')[0]}. {mine.length ? `${mine.length} ${mine.length === 1 ? 'projeto espera' : 'projetos esperam'} você.` : 'Nada pendente com você.'}</h1>
        </div>
        <NewProject />
      </div>

      <div className="kpis">
        <div className="kpi"><span className="label">Em andamento</span><b>{active.length}</b></div>
        <div className="kpi"><span className="label">Com você</span><b>{mine.length}</b></div>
        <div className="kpi"><span className="label">Com a cliente</span><b>{theirs.length}</b></div>
        <div className="kpi"><span className="label">Entrega em 7 dias</span><b>{dueSoon}</b></div>
      </div>

      <div className="grid2" style={{ marginBottom: 24 }}>
        <div className="panel">
          <span className="label">Precisa de você</span>
          {mine.length ? (
            <ul className="events">{mine.map((p) => (
              <li key={p.id}><span className="sev cliente" /><Link href={`/estudio/projetos/${p.id}`}><b>{p.brandName}</b> · {note(p)}</Link><span className="when">{fmtDate(p.updatedAt)}</span></li>
            ))}</ul>
          ) : <p className="empty">Tudo em dia. Os projetos aguardam as clientes.</p>}
        </div>
        <div className="panel">
          <span className="label">Atividade recente</span>
          {events.length ? (
            <ul className="events">{events.map((e) => (
              <li key={e.id}><span className={`sev ${e.actor}`} /><span><Link href={`/estudio/projetos/${e.project.id}`}><b>{e.project.brandName}</b></Link> <span className="muted">{e.text}</span></span><span className="when">{fmtDateTime(e.createdAt)}</span></li>
            ))}</ul>
          ) : <p className="empty">As ações das clientes e da equipe aparecem aqui.</p>}
        </div>
      </div>

      <span className="label" style={{ display: 'block', marginBottom: 10 }}>Projetos por etapa</span>
      <div className="board">
        {STAGES.map((s) => {
          const items = projects.filter((p) => p.stage === s.id);
          return (
            <div className="col" key={s.id}>
              <h3><span>{s.name}</span><span>{items.length}</span></h3>
              {items.map((p) => {
                const w = whoActs(p);
                return (
                  <Link className="card" key={p.id} href={`/estudio/projetos/${p.id}`}>
                    <b>{p.brandName}</b>
                    <small>{p.clientName}{p.dueDate ? ` · entrega ${fmtDate(p.dueDate)}` : ''}</small>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <small>{note(p)}</small>
                      {w !== 'ninguem' && <span className={`pill ${w === 'estudio' ? 'now' : 'wait'}`}>{w === 'estudio' ? 'você' : 'cliente'}</span>}
                    </div>
                  </Link>
                );
              })}
              {!items.length && <p className="empty">Nenhum projeto</p>}
            </div>
          );
        })}
      </div>
      {!projects.length && <p className="muted" style={{ marginTop: 16 }}>Crie o primeiro projeto em “Novo projeto”. Você recebe um link para enviar à cliente.</p>}
    </>
  );
}
