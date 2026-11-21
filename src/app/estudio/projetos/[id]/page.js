import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { STAGES, stageIndex, whoActs } from '@/lib/stages';
import { QUESTIONS, parseBriefing } from '@/lib/briefing';
import { parsePresentation, COVERS } from '@/lib/presentation';
import { fileUrl, fmtDate, fmtDateTime, fmtSize } from '@/lib/url';
import {
  setStage, regenerateLink, addMoodItems, updateMoodCaption, deleteMoodItem, savePresentation,
  addAssets, deleteAsset, postNote, updateProject, deleteProject,
} from '@/lib/actions-studio';
import Submit from '@/components/Submit';
import CopyLink from '@/components/CopyLink';

export default async function ProjectPage({ params }) {
  const p = await db.project.findUnique({
    where: { id: params.id },
    include: {
      moodItems: { orderBy: { position: 'asc' } },
      assets: { orderBy: { position: 'asc' } },
      events: { orderBy: { createdAt: 'desc' }, take: 50 },
    },
  });
  if (!p) notFound();
  const base = process.env.PUBLIC_URL || '';
  const link = `${base}/p/${p.token}`;
  const brief = parseBriefing(p.briefing);
  const pres = parsePresentation(p.presentation);
  const cur = stageIndex(p.stage);
  const answered = p.moodItems.filter((m) => m.liked && m.disliked).length;
  const logos = p.assets.filter((a) => a.kind === 'logo');
  const mockups = p.assets.filter((a) => a.kind === 'mockup');
  const grafismos = p.assets.filter((a) => a.kind === 'grafismo');
  const delivery = p.assets.filter((a) => a.kind === 'entrega');
  const w = whoActs(p);

  return (
    <>
      <div className="vhead">
        <div>
          <span className="label"><Link href="/estudio">Painel</Link> / {p.brandName}</span>
          <h1>{p.brandName}</h1>
          <p>{p.clientName}{p.clientEmail ? ` · ${p.clientEmail}` : ''}{p.dueDate ? ` · entrega prevista ${fmtDate(p.dueDate, { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}</p>
        </div>
        <span className={`pill ${w === 'estudio' ? 'now' : w === 'cliente' ? 'wait' : 'ok'}`}>
          {STAGES[cur].name} · {w === 'estudio' ? 'com você' : w === 'cliente' ? 'com a cliente' : 'concluído'}
        </span>
      </div>

      <div className="grid2">
        <div className="stack">
          {/* ETAPA */}
          <section className="panel">
            <span className="label">Etapa do projeto</span>
            <p className="muted small" style={{ marginBottom: 12 }}>A cliente vê a etapa atual no portal. Ao mover para Proposta, ela recebe a apresentação para aprovar.</p>
            <div className="row">
              {STAGES.map((s, i) => (
                <form key={s.id} action={setStage}>
                  <input type="hidden" name="id" value={p.id} /><input type="hidden" name="stage" value={s.id} />
                  <button type="submit" className={`btn sm ${i === cur ? 'primary' : 'ghost'}`} aria-pressed={i === cur}>{i < cur ? '✓ ' : ''}{s.name}</button>
                </form>
              ))}
            </div>
          </section>

          {/* BRIEFING */}
          <section className="panel" id="briefing">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="label">Briefing</span>
              <span className={`pill ${p.briefingAt ? 'ok' : 'wait'}`}>{p.briefingAt ? `Enviado ${fmtDate(p.briefingAt)}` : Object.keys(brief).length ? 'Rascunho da cliente' : 'Não respondido'}</span>
            </div>
            {Object.keys(brief).length ? (
              <dl style={{ margin: 0 }}>
                {QUESTIONS.map((q) => {
                  const a = brief[q.id];
                  const v = Array.isArray(a) ? a.join(', ') : a;
                  return <div key={q.id} style={{ marginBottom: 14 }}><dt style={{ fontWeight: 600, fontSize: 13 }}>{q.label}</dt><dd className="muted" style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{v || '—'}</dd></div>;
                })}
              </dl>
            ) : <p className="empty">A cliente responde pelo link. As respostas aparecem aqui.</p>}
          </section>

          {/* MOODBOARD */}
          <section className="panel" id="moodboard">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="label">Moodboard</span>
              {p.moodItems.length > 0 && <span className={`pill ${p.moodSentAt ? 'ok' : 'wait'}`}>{p.moodSentAt ? `Feedback enviado ${fmtDate(p.moodSentAt)}` : `${answered} de ${p.moodItems.length} comentadas`}</span>}
            </div>
            <form action={addMoodItems} className="row" style={{ marginBottom: 16 }}>
              <input type="hidden" name="id" value={p.id} />
              <input type="file" name="imagens" accept="image/*" multiple required aria-label="Imagens do moodboard" />
              <Submit className="btn sm" pendingText="Enviando…">Adicionar imagens</Submit>
            </form>
            {p.moodItems.length ? (
              <div className="thumbs">
                {p.moodItems.map((m) => (
                  <div className="thumb" key={m.id}>
                    <a className="im" href={fileUrl(m.file)} target="_blank" rel="noopener" title="Abrir em tamanho real" style={{ display: "block", cursor: "zoom-in" }}><img src={fileUrl(m.file)} alt={m.caption || "Referência"} loading="lazy" /></a>
                    <div className="tb">
                      <form action={updateMoodCaption} className="row" style={{ gap: 4 }}>
                        <input type="hidden" name="itemId" value={m.id} />
                        <input className="input" name="caption" defaultValue={m.caption || ''} placeholder="Legenda" aria-label="Legenda" style={{ flex: 1, minWidth: 0 }} />
                      </form>
                      {m.liked && <small><b style={{ color: 'var(--ok)' }}>Gostou:</b> {m.liked}</small>}
                      {m.disliked && <small><b style={{ color: 'var(--bad)' }}>Não gostou:</b> {m.disliked}</small>}
                      <form action={deleteMoodItem}><input type="hidden" name="itemId" value={m.id} /><button className="linkbtn" type="submit">Remover</button></form>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="empty">Adicione as referências. Em cada uma, a cliente escreve o que gostou e o que não gostou.</p>}
            <p className="muted small" style={{ marginTop: 10 }}>Para salvar a legenda, digite e aperte Enter.</p>
          </section>

          {/* PROPOSTA */}
          <section className="panel" id="proposta">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="label">Proposta e apresentação</span>
              <div className="row">
                {p.decision && <span className={`pill ${p.decision === 'aprovado' ? 'ok' : 'warn'}`}>{p.decision === 'aprovado' ? 'Aprovada' : 'Ajustes pedidos'} · {fmtDate(p.decisionAt)}</span>}
                <a className="btn sm" href={`/p/${p.token}/apresentacao`} target="_blank" rel="noopener">Pré-visualizar ↗</a>
              </div>
            </div>
            {p.decision === 'ajustes' && p.decisionNote && <p className="msg-err" style={{ color: 'var(--warn)', marginBottom: 16 }}>Pedido da cliente: “{p.decisionNote}”. Depois de ajustar, clique em Proposta na etapa para reenviar.</p>}

            <div className="fgrid" style={{ marginBottom: 20 }}>
              <div>
                <span className="field"><span>Logo</span></span>
                <p className="muted small" style={{ margin: '4px 0 8px' }}>SVG ou PNG. A primeira é a principal. Use fundo transparente.</p>
                <AssetList items={logos} />
                <UploadAssets id={p.id} kind="logo" label="Enviar logo" />
              </div>
              <div>
                <span className="field"><span>Mockups e aplicações</span></span>
                <p className="muted small" style={{ margin: '4px 0 8px' }}>Cartão, embalagem, post, fachada. Aparecem em grade na apresentação.</p>
                <AssetList items={mockups} />
                <UploadAssets id={p.id} kind="mockup" label="Enviar mockups" multiple />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <span className="field"><span>Grafismo da marca <span className="hint">opcional</span></span></span>
              <p className="muted small" style={{ margin: '4px 0 8px' }}>Padrão, textura ou ilustração da identidade para o fundo da capa. Imagem larga (ex.: 2400 × 1500 px).</p>
              <AssetList items={grafismos} />
              {!grafismos.length && <UploadAssets id={p.id} kind="grafismo" label="Enviar grafismo" />}
            </div>

            <form action={savePresentation} className="form">
              <input type="hidden" name="id" value={p.id} />
              <div className="field">
                <label htmlFor="pr-cover">Fundo da capa</label>
                <select id="pr-cover" name="cover" defaultValue={pres.cover}>
                  {COVERS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <span className="hint">Escolha o que combina com a marca. “Grafismo” usa a imagem enviada logo abaixo; sem imagem, a capa fica lisa.</span>
              </div>
              <div className="field"><label htmlFor="pr-title">Frase de abertura <span className="hint">aparece na capa, abaixo do nome</span></label><input id="pr-title" name="title" defaultValue={pres.title} placeholder="Ex.: cerâmica feita no ritmo da maré" /></div>
              <div className="field"><label htmlFor="pr-concept">Conceito</label><textarea id="pr-concept" name="concept" defaultValue={pres.concept} placeholder="O texto grande do slide de conceito. Uma ou duas frases." /></div>
              <div><span className="field"><span>Três pilares do conceito</span></span>
                <div className="stack" style={{ gap: 8, marginTop: 6 }}>
                  {pres.pillars.map((pl, i) => (
                    <div className="fgrid" key={i} style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)' }}>
                      <input className="input" name={`pt${i}`} defaultValue={pl.t} placeholder="Título" aria-label={`Pilar ${i + 1}, título`} />
                      <input className="input" name={`pd${i}`} defaultValue={pl.d} placeholder="Explicação curta" aria-label={`Pilar ${i + 1}, explicação`} />
                    </div>
                  ))}
                </div>
              </div>
              <div><span className="field"><span>Paleta</span></span>
                <div className="stack" style={{ gap: 8, marginTop: 6 }}>
                  {pres.palette.map((c, i) => (
                    <div className="swrow" key={i}>
                      <input type="color" name={`ch${i}`} defaultValue={c.hex} aria-label={`Cor ${i + 1}`} />
                      <input className="input" name={`cn${i}`} defaultValue={c.name} placeholder="Nome da cor" aria-label={`Nome da cor ${i + 1}`} />
                      <span className="when">{c.hex}</span>
                      <input className="input" name={`cd${i}`} defaultValue={c.note} placeholder="Onde usar" aria-label={`Uso da cor ${i + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="fgrid">
                <div className="field"><label htmlFor="pr-df">Fonte de títulos <span className="hint">nome no Google Fonts</span></label><input id="pr-df" name="displayFont" defaultValue={pres.displayFont} /></div>
                <div className="field"><label htmlFor="pr-bf">Fonte de textos</label><input id="pr-bf" name="bodyFont" defaultValue={pres.bodyFont} /></div>
              </div>
              <div className="field"><label htmlFor="pr-tn">Por que essas fontes</label><textarea id="pr-tn" name="typeNote" defaultValue={pres.typeNote} style={{ minHeight: 60 }} /></div>
              <div className="field"><label htmlFor="pr-cl">Pergunta final</label><input id="pr-cl" name="closing" defaultValue={pres.closing} /></div>
              <div><Submit>Salvar apresentação</Submit></div>
            </form>
          </section>

          {/* ENTREGA */}
          <section className="panel" id="entrega">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="label">Arquivos de entrega</span>
              <span className={`pill ${p.stage === 'entrega' ? 'ok' : 'wait'}`}>{p.stage === 'entrega' ? 'Liberados para a cliente' : 'A cliente vê quando a etapa for Entrega'}</span>
            </div>
            <AssetList items={delivery} download />
            <form action={addAssets} className="fgrid" style={{ marginTop: 12, alignItems: 'end' }}>
              <input type="hidden" name="id" value={p.id} /><input type="hidden" name="kind" value="entrega" />
              <div className="field"><label htmlFor="en-label">Nome para a cliente <span className="hint">ex.: Manual da marca</span></label><input id="en-label" name="label" /></div>
              <div className="field"><label htmlFor="en-file">Arquivo(s)</label><input id="en-file" type="file" name="arquivos" multiple required /></div>
              <div><Submit className="btn sm" pendingText="Enviando…">Adicionar à entrega</Submit></div>
            </form>
          </section>
        </div>

        <div className="stack">
          <section className="panel">
            <span className="label">Link da cliente</span>
            <CopyLink url={link} />
            <p className="muted small" style={{ marginTop: 10 }}>Quem tiver este link vê o projeto. Envie só para a cliente.</p>
            <form action={regenerateLink} style={{ marginTop: 8 }}><input type="hidden" name="id" value={p.id} /><button className="linkbtn" type="submit">Gerar novo link (o anterior para de funcionar)</button></form>
          </section>

          <section className="panel">
            <span className="label">Histórico</span>
            <form action={postNote} className="row" style={{ marginBottom: 10 }}>
              <input type="hidden" name="id" value={p.id} />
              <input className="input" name="text" placeholder="Anotação interna" aria-label="Anotação interna" style={{ flex: 1, minWidth: 0 }} />
              <Submit className="btn sm">Anotar</Submit>
            </form>
            {p.events.length ? (
              <ul className="events">{p.events.map((e) => (
                <li key={e.id}><span className={`sev ${e.actor}`} /><span>{e.text}</span><span className="when">{fmtDateTime(e.createdAt)}</span></li>
              ))}</ul>
            ) : <p className="empty">Sem atividade ainda.</p>}
          </section>

          <section className="panel">
            <span className="label">Dados do projeto</span>
            <form action={updateProject} className="form">
              <input type="hidden" name="id" value={p.id} />
              <div className="field"><label htmlFor="ed-brand">Marca</label><input id="ed-brand" name="brandName" defaultValue={p.brandName} /></div>
              <div className="field"><label htmlFor="ed-client">Cliente</label><input id="ed-client" name="clientName" defaultValue={p.clientName} /></div>
              <div className="field"><label htmlFor="ed-email">E-mail</label><input id="ed-email" name="clientEmail" type="email" defaultValue={p.clientEmail || ''} /></div>
              <div className="fgrid">
                <div className="field"><label htmlFor="ed-due">Entrega</label><input id="ed-due" name="dueDate" type="date" defaultValue={p.dueDate ? new Date(p.dueDate).toISOString().slice(0, 10) : ''} /></div>
                <div className="field"><label htmlFor="ed-rounds">Rodadas de ajuste</label><input id="ed-rounds" name="roundsIncluded" type="number" min="0" max="10" defaultValue={p.roundsIncluded} /></div>
              </div>
              <p className="muted small">Rodadas usadas: {p.roundsUsed}</p>
              <div><Submit className="btn sm">Salvar dados</Submit></div>
            </form>
            <details className="danger" style={{ marginTop: 20 }}>
              <summary>Excluir projeto</summary>
              <form action={deleteProject} className="form" style={{ marginTop: 10 }}>
                <input type="hidden" name="id" value={p.id} />
                <div className="field"><label htmlFor="del">Digite “{p.brandName}” para confirmar. Isso apaga o projeto e todos os arquivos.</label><input id="del" name="confirm" autoComplete="off" /></div>
                <div><button className="btn sm danger" type="submit">Excluir de vez</button></div>
              </form>
            </details>
          </section>
        </div>
      </div>
    </>
  );
}

function AssetList({ items, download }) {
  if (!items.length) return null;
  return (
    <ul className="files" style={{ marginBottom: 8 }}>
      {items.map((a) => {
        const ext = a.file.split('.').pop();
        const isImg = /^(png|jpe?g|webp|gif|svg)$/i.test(ext);
        return (
          <li key={a.id}>
            <span className="ext">{isImg ? <img src={fileUrl(a.file)} alt="" /> : ext}</span>
            <div><b>{a.label}</b><br /><small className="muted">{ext.toUpperCase()} · {fmtSize(a.size)}</small></div>
            <div className="row" style={{ gap: 12 }}>
              {download && <a className="linkbtn" href={fileUrl(a.file, null, { download: true, name: a.label })}>Baixar</a>}
              <form action={deleteAsset}><input type="hidden" name="assetId" value={a.id} /><button className="linkbtn" type="submit">Remover</button></form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function UploadAssets({ id, kind, label, multiple }) {
  return (
    <form action={addAssets} className="row">
      <input type="hidden" name="id" value={id} /><input type="hidden" name="kind" value={kind} />
      <input type="file" name="arquivos" accept="image/*" multiple={multiple} required aria-label={label} style={{ maxWidth: '100%' }} />
      <Submit className="btn sm" pendingText="Enviando…">{label}</Submit>
    </form>
  );
}
