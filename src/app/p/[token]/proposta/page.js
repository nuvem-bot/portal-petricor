import Link from 'next/link';
import { loadClientProject } from '@/lib/client-project';
import { parsePresentation } from '@/lib/presentation';
import { fileUrl, fmtDate } from '@/lib/url';
import { decide } from '@/lib/actions-client';
import StateForm from '@/components/StateForm';
import Submit from '@/components/Submit';

export default async function Proposta({ params }) {
  const p = await loadClientProject(params.token);
  const base = `/p/${p.token}`;
  const ready = ['proposta', 'finalizacao', 'entrega'].includes(p.stage);
  const pres = parsePresentation(p.presentation);
  const logo = p.assets.find((a) => a.kind === 'logo');
  const left = p.roundsIncluded - p.roundsUsed;

  if (!ready) {
    return (
      <>
        <div className="vhead"><div><span className="label">Etapa 4 · Proposta</span><h1>A proposta ainda está sendo criada</h1><p>Quando estiver pronta, ela aparece aqui com uma apresentação completa da sua marca.</p></div></div>
      </>
    );
  }
  return (
    <>
      <div className="vhead">
        <div><span className="label">Etapa 4 · Proposta e aprovação</span><h1>Sua identidade visual</h1><p>Abra a apresentação em tela cheia. Leva uns 3 minutos.</p></div>
        <span className={`pill ${p.decision === 'aprovado' ? 'ok' : p.decision === 'ajustes' ? 'warn' : 'now'}`}>
          {p.decision === 'aprovado' ? `Aprovada em ${fmtDate(p.decisionAt)}` : p.decision === 'ajustes' ? 'Ajustes pedidos' : 'Aguardando você'}
        </span>
      </div>
      <div className="grid2">
        <Link href={`${base}/apresentacao`} className="panel" style={{ background: pres.palette[0].hex, borderColor: 'transparent', aspectRatio: '16/9', display: 'grid', placeItems: 'center', position: 'relative', padding: 0, overflow: 'hidden', textDecoration: 'none' }}>
          {logo ? <img src={fileUrl(logo.file, p.token)} alt={`Logo ${p.brandName}`} style={{ maxWidth: '40%', maxHeight: '45%', objectFit: 'contain' }} />
            : <span style={{ fontFamily: 'var(--display)', fontSize: 'clamp(32px,6vw,64px)', color: pres.palette[1].hex }}>{p.brandName}</span>}
          <span className="pill" style={{ position: 'absolute', left: 16, bottom: 16, background: pres.palette[1].hex, color: pres.palette[0].hex }}>Abrir apresentação</span>
        </Link>
        <div className="panel">
          <span className="label">O que você achou?</span>
          {p.decision === 'aprovado' && <p className="msg-ok">Você aprovou a identidade. A designer já está finalizando os arquivos.</p>}
          {p.decision === 'ajustes' && (
            <div className="stack" style={{ gap: 10 }}>
              <p className="msg-ok" style={{ color: 'var(--warn)' }}>Pedido de ajuste enviado em {fmtDate(p.decisionAt)}.</p>
              <p className="muted small">“{p.decisionNote}”</p>
              <p className="muted small">A nova versão aparece aqui quando estiver pronta.</p>
            </div>
          )}
          {!p.decision && p.stage === 'proposta' && (
            <StateForm action={decide}>
              <input type="hidden" name="token" value={p.token} />
              <p className="small">Se estiver tudo certo, aprove e a designer parte para a finalização. Se quiser mudar algo, descreva o ajuste. {left > 0 ? `Você tem ${left} ${left === 1 ? 'rodada' : 'rodadas'} de ajuste.` : 'As rodadas de ajuste incluídas já foram usadas.'}</p>
              <div className="field"><label htmlFor="note">Comentários</label><textarea id="note" name="note" placeholder="Ex.: amei o símbolo, mas queria testar o azul um pouco mais escuro." /></div>
              <div className="row">
                <Submit name="decision" value="aprovado" pendingText="Enviando…">Aprovar identidade</Submit>
                {left > 0 && <Submit className="btn ghost" name="decision" value="ajustes" pendingText="Enviando…">Pedir ajustes</Submit>}
              </div>
            </StateForm>
          )}
        </div>
      </div>
    </>
  );
}
