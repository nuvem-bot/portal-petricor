import Link from 'next/link';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { stageName } from '@/lib/stages';
import { addPerson, setRole, setActive, resetPassword, setClientAccess, newClientLink, sendTestMail } from '@/lib/actions-settings';
import { mailReady } from '@/lib/mail';
import StateForm from '@/components/StateForm';
import Submit from '@/components/Submit';
import CopyLink from '@/components/CopyLink';

export const metadata = { title: 'Configurações · Portal Petricor' };

const ROLE_NAME = { adm: 'Adm', equipe: 'Equipe' };

export default async function Configuracoes() {
  const me = await requireAdmin();
  const people = await db.designer.findMany({ orderBy: [{ active: 'desc' }, { name: 'asc' }] });
  const projects = await db.project.findMany({ orderBy: { updatedAt: 'desc' } });
  const base = process.env.PUBLIC_URL || '';

  return (
    <>
      <div className="vhead">
        <div>
          <span className="label">Configurações</span>
          <h1>Acessos ao portal</h1>
        </div>
      </div>

      <section className="panel">
        <h2>Tipos de acesso</h2>
        <ul className="access-types">
          <li><b>Adm</b><span className="muted small">Vê tudo, trabalha nos projetos, libera e tira acessos, pausa links de cliente e pode excluir projetos.</span></li>
          <li><b>Equipe</b><span className="muted small">Entra no painel e trabalha em todos os projetos. Não vê esta tela e não exclui projetos.</span></li>
          <li><b>Cliente</b><span className="muted small">Não tem senha. Entra pelo link do próprio projeto e só vê o projeto dele. Você pode pausar o link quando quiser.</span></li>
        </ul>
      </section>

      <section className="panel">
        <h2>Avisos por e-mail</h2>
        {mailReady() ? (
          <p className="muted small" style={{ margin: '8px 0 12px' }}><span className="cur-dot" /> Ligados. O portal avisa o cliente quando a etapa muda, quando a apresentação fica pronta e quando recebe o link. A designer do projeto é avisada quando o cliente envia o briefing, comenta o moodboard, aprova ou pede ajustes. Quem entra na equipe recebe um e-mail de boas-vindas.</p>
        ) : (
          <p className="msg-err" style={{ margin: '8px 0 12px' }}>Ainda não configurados no servidor. Enquanto isso, nenhum e-mail sai.</p>
        )}
        <StateForm action={sendTestMail} className="row"><Submit className="btn sm ghost">Mandar um e-mail de teste para mim</Submit></StateForm>
      </section>

      <section className="panel">
        <h2>Equipe do estúdio</h2>
        <ul className="people">
          {people.map((d) => {
            const self = d.id === me.id;
            return (
              <li key={d.id} className={d.active ? '' : 'off'}>
                <div>
                  <b>{d.name}</b>{self && <span className="muted small"> (você)</span>}<br />
                  <small className="muted">{d.email}</small>
                </div>
                <div className="row" style={{ gap: 12 }}>
                  <span className={`pill ${d.active ? (d.role === 'adm' ? 'now' : 'ok') : 'wait'}`}>{d.active ? ROLE_NAME[d.role] || d.role : 'Desativado'}</span>
                  {!self && d.active && (
                    <form action={setRole}>
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="role" value={d.role === 'adm' ? 'equipe' : 'adm'} />
                      <button className="linkbtn" type="submit">{d.role === 'adm' ? 'Tornar equipe' : 'Tornar adm'}</button>
                    </form>
                  )}
                  {!self && (
                    <form action={setActive}>
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="active" value={d.active ? '0' : '1'} />
                      <button className="linkbtn" type="submit">{d.active ? 'Desativar acesso' : 'Liberar acesso'}</button>
                    </form>
                  )}
                  <details className="inline">
                    <summary className="linkbtn">Trocar senha</summary>
                    <StateForm action={resetPassword} className="form row" style={{ marginTop: 8 }}>
                      <input type="hidden" name="id" value={d.id} />
                      <input className="input" name="senha" type="text" minLength={10} placeholder="Nova senha (10+ caracteres)" aria-label={`Nova senha de ${d.name}`} autoComplete="new-password" required />
                      <Submit className="btn sm">Salvar senha</Submit>
                    </StateForm>
                  </details>
                </div>
              </li>
            );
          })}
        </ul>

        <h3 style={{ marginTop: 24 }}>Liberar acesso para alguém novo</h3>
        <StateForm action={addPerson}>
          <div className="fgrid">
            <div className="field"><label htmlFor="np-name">Nome</label><input id="np-name" name="name" required /></div>
            <div className="field"><label htmlFor="np-email">E-mail</label><input id="np-email" name="email" type="email" required /></div>
            <div className="field"><label htmlFor="np-role">Tipo de acesso</label>
              <select id="np-role" name="role" defaultValue="equipe"><option value="equipe">Equipe</option><option value="adm">Adm</option></select>
            </div>
            <div className="field"><label htmlFor="np-senha">Senha inicial</label><input id="np-senha" name="senha" type="text" minLength={10} autoComplete="new-password" required /></div>
          </div>
          <div><Submit pendingText="Criando…">Liberar acesso</Submit></div>
        </StateForm>
      </section>

      <section className="panel">
        <h2>Clientes</h2>
        <p className="muted small">Cada cliente entra só pelo link do projeto dele. Pausar deixa o link fora do ar sem perder nada. Gerar um novo link faz o anterior parar de funcionar.</p>
        {projects.length === 0 ? <p className="muted">Nenhum projeto ainda.</p> : (
          <ul className="people">
            {projects.map((p) => (
              <li key={p.id} className={p.clientAccess ? '' : 'off'}>
                <div>
                  <b>{p.clientName}</b> <span className="muted">· <Link href={`/estudio/projetos/${p.id}`}>{p.brandName}</Link></span><br />
                  <small className="muted">{p.clientEmail || 'sem e-mail'} · {stageName(p.stage)}</small>
                </div>
                <div className="row" style={{ gap: 12 }}>
                  <span className={`pill ${p.clientAccess ? 'ok' : 'wait'}`}>{p.clientAccess ? 'Link ativo' : 'Link pausado'}</span>
                  <form action={setClientAccess}>
                    <input type="hidden" name="id" value={p.id} /><input type="hidden" name="on" value={p.clientAccess ? '0' : '1'} />
                    <button className="linkbtn" type="submit">{p.clientAccess ? 'Pausar acesso' : 'Liberar acesso'}</button>
                  </form>
                  <form action={newClientLink}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="linkbtn" type="submit">Gerar novo link</button>
                  </form>
                </div>
                {p.clientAccess && <div className="people-link"><CopyLink url={`${base}/p/${p.token}`} /></div>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
