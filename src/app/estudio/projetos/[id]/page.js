import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireDesigner } from '@/lib/auth';
import { STAGES, stageIndex, whoActs } from '@/lib/stages';
import { QUESTIONS, parseBriefing } from '@/lib/briefing';
import { parsePresentation, COVERS, BUILD_SLOTS, MAX_COLORS, MAX_FONTS, LOGO_VERSIONS, WEIGHTS } from '@/lib/presentation';
import Tabs from '@/components/Tabs';
import PaletteEditor from '@/components/PaletteEditor';
import { fileUrl, fmtDate, fmtDateTime, fmtSize } from '@/lib/url';
import {
  setStage, regenerateLink, addMoodItems, updateMoodCaption, deleteMoodItem, savePresentation, publishPresentation,
  addAssets, deleteAsset, postNote, updateProject, deleteProject,
  studioSaveBriefing, studioMoodNote, studioMoodReceived,
} from '@/lib/actions-studio';
import Submit from '@/components/Submit';
import CopyLink from '@/components/CopyLink';
import StateForm from '@/components/StateForm';
import BriefingFields from '@/components/BriefingFields';

export default async function ProjectPage({ params }) {
  const p = await db.project.findUnique({
    where: { id: params.id },
    include: {
      moodItems: { orderBy: { position: 'asc' } },
      assets: { orderBy: { position: 'asc' } },
      versions: { orderBy: { number: 'desc' } },
      events: { orderBy: { createdAt: 'desc' }, take: 50 },
    },
  });
  if (!p) notFound();
  const me = await requireDesigner();
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
  const briefFiles = p.assets.filter((a) => a.kind === 'briefing');
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
          {STAGES[cur].name} · {w === 'estudio' ? 'com você' : w === 'cliente' ? 'com o cliente' : 'concluído'}
        </span>
      </div>

      <div className="grid2">
        <div className="stack">
          {/* ETAPA */}
          <section className="panel">
            <span className="label">Etapa do projeto</span>
            <p className="muted small" style={{ marginBottom: 12 }}>O cliente vê a etapa atual no portal. A apresentação só aparece para ele depois de “Liberar para o cliente”.</p>
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
              <span className={`pill ${p.briefingAt ? 'ok' : 'wait'}`}>{p.briefingAt ? `Enviado ${fmtDate(p.briefingAt)}` : Object.keys(brief).length ? 'Rascunho do cliente' : 'Não respondido'}</span>
            </div>
            {Object.keys(brief).length ? (
              <dl style={{ margin: 0 }}>
                {QUESTIONS.map((q) => {
                  const a = brief[q.id];
                  const v = Array.isArray(a) ? a.join(', ') : a;
                  return <div key={q.id} style={{ marginBottom: 14 }}>{q.section && <div className="label" style={{ margin: '18px 0 8px' }}>{q.section}</div>}<dt style={{ fontWeight: 600, fontSize: 13 }}>{q.label}</dt><dd className="muted" style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{v || '—'}</dd></div>;
                })}
              </dl>
            ) : <p className="empty">O cliente responde pelo link. As respostas aparecem aqui.</p>}
            {briefFiles.length > 0 && <div style={{ marginTop: 12 }}><span className="label">Arquivos do briefing</span><AssetList items={briefFiles} download /></div>}
            <details className="upload-existing" style={{ marginTop: 16 }}>
              <summary className="btn sm ghost">{Object.keys(brief).length ? 'Editar respostas / anexar arquivo' : 'Subir briefing que o cliente já respondeu'}</summary>
              <p className="muted small" style={{ margin: '10px 0' }}>Para clientes que responderam fora do portal (por exemplo, no Respondi). Anexe o PDF e, se quiser, copie as respostas para os campos. Ao salvar, o briefing conta como recebido.</p>
              <StateForm action={studioSaveBriefing}>
                <input type="hidden" name="id" value={p.id} />
                <div className="field"><label htmlFor="sb-arquivos">PDF ou imagens do briefing</label><input id="sb-arquivos" type="file" name="arquivos" accept="application/pdf,image/*" multiple /></div>
                <BriefingFields answers={{ nome: p.clientName, email: p.clientEmail || '', marca: p.brandName, ...brief }} prefix="sb" />
                <div><Submit>Salvar briefing</Submit></div>
              </StateForm>
            </details>
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
                      {p.moodSentAt || m.liked || m.disliked ? <>
                        {m.liked && <small><b style={{ color: 'var(--ok)' }}>Gostou:</b> {m.liked}</small>}
                        {m.disliked && <small><b style={{ color: 'var(--bad)' }}>Não gostou:</b> {m.disliked}</small>}
                      </> : null}
                      {!p.moodSentAt && (
                        <details>
                          <summary className="linkbtn">{m.liked || m.disliked ? 'Editar comentário' : 'Já tenho o comentário'}</summary>
                          <form action={studioMoodNote} className="form" style={{ gap: 6, marginTop: 6 }}>
                            <input type="hidden" name="itemId" value={m.id} />
                            <textarea className="input" name="liked" defaultValue={m.liked || ''} placeholder="Gostou de…" aria-label="O cliente gostou de" rows={2} />
                            <textarea className="input" name="disliked" defaultValue={m.disliked || ''} placeholder="Não gostou de…" aria-label="O cliente não gostou de" rows={2} />
                            <Submit className="btn sm">Salvar</Submit>
                          </form>
                        </details>
                      )}
                      <form action={deleteMoodItem}><input type="hidden" name="itemId" value={m.id} /><button className="linkbtn" type="submit">Remover</button></form>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="empty">Adicione as referências. Em cada uma, o cliente escreve o que gostou e o que não gostou.</p>}
            <p className="muted small" style={{ marginTop: 10 }}>Para salvar a legenda, digite e aperte Enter.</p>
            {p.moodItems.length > 0 && !p.moodSentAt && (
              <form action={studioMoodReceived} className="row" style={{ marginTop: 12, gap: 12 }}>
                <input type="hidden" name="id" value={p.id} />
                <button className="btn sm ghost" type="submit">Marcar feedback como recebido</button>
                <span className="muted small">Use quando o cliente já comentou o moodboard fora do portal (por exemplo, no Notion). Suba as imagens, registre os comentários em “Já tenho o comentário” e marque aqui.</span>
              </form>
            )}
          </section>

          {/* PROPOSTA */}
          <section className="panel" id="proposta">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="label">Proposta e apresentação</span>
              <div className="row">
                {p.decision && <span className={`pill ${p.decision === 'aprovado' ? 'ok' : 'warn'}`}>{p.decision === 'aprovado' ? 'Aprovada' : 'Ajustes pedidos'} · {fmtDate(p.decisionAt)}</span>}
                <span className={`pill ${p.versions.length ? 'ok' : 'wait'}`}>{p.versions.length ? `Versão ${p.versions[0].number} liberada ${fmtDate(p.versions[0].publishedAt)}` : 'Ainda não liberada'}</span>
                <a className="btn sm" href={`/p/${p.token}/apresentacao?rascunho=1`} target="_blank" rel="noopener">Pré-visualizar rascunho ↗</a>
              </div>
            </div>
            {p.decision === 'ajustes' && p.decisionNote && <p className="msg-err" style={{ color: 'var(--warn)', marginBottom: 16 }}>Pedido do cliente: “{p.decisionNote}”. Depois de ajustar, clique em “Liberar para o cliente” para enviar a nova versão.</p>}
            {p.versions.length > 0 && (
              <ul className="files" style={{ marginBottom: 16 }}>
                {p.versions.map((v) => (
                  <li key={v.id}>
                    <span className="ext">v{v.number}</span>
                    <div>
                      <b>Versão {v.number}</b> <span className={`pill ${v.decision === 'aprovado' ? 'ok' : v.decision === 'ajustes' ? 'warn' : 'wait'}`}>{v.decision === 'aprovado' ? 'aprovada' : v.decision === 'ajustes' ? 'pediu ajustes' : 'aguardando o cliente'}</span><br />
                      <small className="muted">Liberada {fmtDateTime(v.publishedAt)}{v.decisionNote ? ` · “${v.decisionNote}”` : ''}</small>
                    </div>
                    <a className="linkbtn" href={`/p/${p.token}/apresentacao?v=${v.number}`} target="_blank" rel="noopener">Ver</a>
                  </li>
                ))}
              </ul>
            )}
            <p className="muted small" style={{ marginBottom: 16 }}>Preencha por partes. “Salvar rascunho” guarda tudo sem o cliente ver. “Liberar para o cliente” envia esta versão e move o projeto para Proposta.</p>

            <Tabs storageKey={`pres-tab-${p.id}`} tabs={[
              { id: 'capa', label: 'Capa', done: !!pres.title },
              { id: 'conceito', label: 'Conceito', done: !!(pres.concept || pres.conceptText) },
              { id: 'construcao', label: 'Construção', done: pres.build.length > 0 },
              { id: 'logo', label: 'Logo', done: logos.length > 0 || !!pres.gridImg },
              { id: 'cores', label: 'Cores', done: pres.palette.some((c) => c.name) },
              { id: 'tipografia', label: 'Tipografia', done: pres.fonts.some((f) => f.note || f.sample) },
              { id: 'aplicacoes', label: 'Aplicações', done: mockups.length > 0 },
              { id: 'final', label: 'Final', done: false },
            ]}>
              {/* CAPA */}
              <div className="form">
                <div className="field">
                  <label htmlFor="pr-cover">Fundo da capa</label>
                  <select id="pr-cover" form="pres-form" name="cover" defaultValue={pres.cover}>
                    {COVERS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <span className="hint">“Grafismo” usa a imagem enviada logo abaixo; sem imagem, a capa fica lisa.</span>
                </div>
                <div className="field"><label htmlFor="pr-title">Frase de abertura <span className="hint">aparece na capa, abaixo do nome</span></label><input id="pr-title" form="pres-form" name="title" defaultValue={pres.title} placeholder="Ex.: cerâmica feita no ritmo da maré" /></div>
                <div>
                  <span className="field"><span>Grafismo da marca <span className="hint">opcional</span></span></span>
                  <p className="muted small" style={{ margin: '4px 0 8px' }}>Padrão, textura ou ilustração para o fundo da capa. Imagem larga (ex.: 2400 × 1500 px).</p>
                  <AssetList items={grafismos} />
                  {!grafismos.length && <UploadAssets id={p.id} kind="grafismo" label="Enviar grafismo" />}
                </div>
              </div>

              {/* CONCEITO */}
              <div className="form">
                <div className="field"><label htmlFor="pr-concept">Conceito</label><textarea id="pr-concept" form="pres-form" name="concept" rows={3} defaultValue={pres.concept} placeholder="A frase de efeito, em letra grande." /></div>
                <div className="field"><label htmlFor="pr-ctext">Descrição do conceito</label><textarea id="pr-ctext" form="pres-form" name="conceptText" rows={10} defaultValue={pres.conceptText} placeholder="O texto maior que explica o conceito. Pode ter vários parágrafos: deixe uma linha em branco entre eles." /></div>
              </div>

              {/* CONSTRUÇÃO */}
              <div className="form">
                <div className="field"><label htmlFor="pr-bt">Título do slide</label><input id="pr-bt" form="pres-form" name="buildTitle" defaultValue={pres.buildTitle} placeholder="Ex.: Símbolo" /></div>
                <p className="muted small" style={{ marginTop: -8 }}>Mostre passo a passo como a marca foi construída. Cada etapa tem uma imagem, um título e um texto curto. Deixe em branco as que não usar.</p>
                <ol className="build-edit">
                  {Array.from({ length: BUILD_SLOTS }, (_, i) => pres.build[i] || { t: '', d: '', img: null }).map((st, i) => (
                    <li key={i}>
                      <div className="be-img">{st.img ? <img src={fileUrl(st.img)} alt="" /> : <span>{i + 1}</span>}</div>
                      <div className="stack" style={{ gap: 6, minWidth: 0 }}>
                        <input className="input" form="pres-form" name={`bt${i}`} defaultValue={st.t} placeholder={`Etapa ${i + 1}: título (ex.: O eixo)`} aria-label={`Etapa ${i + 1}, título`} />
                        <textarea className="input" form="pres-form" name={`bd${i}`} defaultValue={st.d} placeholder="Texto curto" aria-label={`Etapa ${i + 1}, texto`} rows={2} />
                        <ImageInput name={`bimg${i}`} current={st.img} label={`Etapa ${i + 1}, imagem`} />
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* LOGO */}
              <div className="form">
                <div>
                  <span className="field"><span>1. Logo na malha</span></span>
                  <p className="muted small" style={{ margin: '4px 0 8px' }}>A primeira tela do logo: ele sobre a malha de construção. Suba a imagem pronta (PNG ou SVG).</p>
                  <div className="build-edit"><div className="be-row">
                    <div className="be-img">{pres.gridImg ? <img src={fileUrl(pres.gridImg)} alt="" /> : <span>#</span>}</div>
                    <ImageInput name="grid" current={pres.gridImg} label="Logo na malha" />
                  </div></div>
                </div>
                <div>
                  <span className="field"><span>2. Versões finais do logo <span className="hint">até 3</span></span></span>
                  <p className="muted small" style={{ margin: '4px 0 8px' }}>Ex.: versão completa, selo, versão em branco. Escolha a cor de fundo de cada uma. A primeira aparece maior.</p>
                  <ol className="build-edit">
                    {Array.from({ length: LOGO_VERSIONS }, (_, i) => pres.logoVersions[i] || { img: null, bg: [pres.palette[1].hex, '#FFFFFF', pres.palette[0].hex][i] }).map((lv, i) => (
                      <li key={i}>
                        <div className="be-img" style={{ background: lv.bg }}>{lv.img ? <img src={fileUrl(lv.img)} alt="" /> : <span>{i + 1}</span>}</div>
                        <div className="stack" style={{ gap: 6, minWidth: 0 }}>
                          <ImageInput name={`lv${i}`} current={lv.img} label={`Versão ${i + 1} do logo`} />
                          <label className="row small" style={{ gap: 8 }}>Fundo
                            <select form="pres-form" name={`lvbg${i}`} defaultValue={lv.bg}>
                              {[...pres.palette.map((c, j) => ({ hex: c.hex, name: c.name || `Cor ${j + 1}` })), { hex: '#FFFFFF', name: 'Branco' }]
                                .filter((c, j, all) => all.findIndex((x) => x.hex.toLowerCase() === c.hex.toLowerCase()) === j)
                                .map((c) => <option key={c.hex} value={c.hex}>{c.name} ({c.hex.toUpperCase()})</option>)}
                            </select>
                          </label>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <span className="field"><span>Logo principal (arquivo)</span></span>
                  <p className="muted small" style={{ margin: '4px 0 8px' }}>Usado na miniatura da proposta e, se não houver logo na malha, na revelação do logo. SVG ou PNG com fundo transparente.</p>
                  <AssetList items={logos} />
                  <UploadAssets id={p.id} kind="logo" label="Enviar logo" />
                </div>
              </div>

              {/* CORES */}
              <div className="form">
                <p className="muted small">As 4 primeiras são as básicas: principal, fundo, destaque e apoio. Adicione outras se a marca tiver.</p>
                <PaletteEditor form="pres-form" initial={pres.palette} max={MAX_COLORS} />
              </div>

              {/* TIPOGRAFIA */}
              <div className="form">
                <p className="muted small">Até 3 fontes do Google Fonts. Ex.: Títulos (Cormorant Garamond), Acento (Pinyon Script), Apoio e texto (Jost). Deixe a família vazia para não usar.</p>
                {Array.from({ length: MAX_FONTS }, (_, i) => pres.fonts[i] || { role: '', family: '', weight: '400', note: '', sample: '' }).map((f, i) => (
                  <fieldset key={i} className="font-edit">
                    <legend>Fonte {i + 1}</legend>
                    <div className="fgrid">
                      <div className="field"><label htmlFor={`ff${i}`}>Família no Google Fonts</label><input id={`ff${i}`} form="pres-form" name={`ff${i}`} defaultValue={f.family} placeholder={['Cormorant Garamond', 'Pinyon Script', 'Jost'][i]} /></div>
                      <div className="field"><label htmlFor={`fr${i}`}>Uso</label><input id={`fr${i}`} form="pres-form" name={`fr${i}`} defaultValue={f.role} placeholder={['Títulos', 'Acento', 'Apoio e texto'][i]} /></div>
                      <div className="field"><label htmlFor={`fw${i}`}>Peso do exemplo</label>
                        <select id={`fw${i}`} form="pres-form" name={`fw${i}`} defaultValue={f.weight}>{WEIGHTS.map((w) => <option key={w} value={w}>{{ 300: 'Light 300', 400: 'Regular 400', 500: 'Medium 500', 700: 'Bold 700' }[w]}</option>)}</select>
                      </div>
                      <div className="field"><label htmlFor={`fn${i}`}>Observação</label><input id={`fn${i}`} form="pres-form" name={`fn${i}`} defaultValue={f.note} placeholder="Ex.: Light 300 e Regular 400" /></div>
                    </div>
                    <div className="field"><label htmlFor={`fs${i}`}>Frase de exemplo</label><input id={`fs${i}`} form="pres-form" name={`fs${i}`} defaultValue={f.sample} placeholder={['Primeiro a gente vive, depois aplica.', 'de Impacto você', 'O texto corrido da marca fica assim.'][i]} /></div>
                  </fieldset>
                ))}
                <div className="field"><label htmlFor="pr-tn">Por que essas fontes <span className="hint">opcional</span></label><textarea id="pr-tn" form="pres-form" name="typeNote" defaultValue={pres.typeNote} style={{ minHeight: 60 }} /></div>
              </div>

              {/* APLICAÇÕES */}
              <div className="form">
                <p className="muted small">Cartão, embalagem, post, fachada. Aparecem em grade na apresentação.</p>
                <AssetList items={mockups} />
                <UploadAssets id={p.id} kind="mockup" label="Enviar mockups" multiple />
              </div>

              {/* FINAL */}
              <div className="form">
                <div className="field"><label htmlFor="pr-cl">Pergunta final</label><input id="pr-cl" form="pres-form" name="closing" defaultValue={pres.closing} /></div>
              </div>
            </Tabs>

            <form id="pres-form" action={savePresentation} className="row pres-actions">
              <input type="hidden" name="id" value={p.id} />
              <Submit className="btn ghost">Salvar rascunho</Submit>
              <Submit formAction={publishPresentation} pendingText="Liberando…">{p.versions.length ? `Liberar versão ${p.versions[0].number + 1} para o cliente` : 'Liberar para o cliente'}</Submit>
            </form>
          </section>

          {/* ENTREGA */}
          <section className="panel" id="entrega">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="label">Arquivos de entrega</span>
              <span className={`pill ${p.stage === 'entrega' ? 'ok' : 'wait'}`}>{p.stage === 'entrega' ? 'Liberados para o cliente' : 'O cliente vê quando a etapa for Entrega'}</span>
            </div>
            <AssetList items={delivery} download />
            <form action={addAssets} className="fgrid" style={{ marginTop: 12, alignItems: 'end' }}>
              <input type="hidden" name="id" value={p.id} /><input type="hidden" name="kind" value="entrega" />
              <div className="field"><label htmlFor="en-label">Nome para o cliente <span className="hint">ex.: Manual da marca</span></label><input id="en-label" name="label" /></div>
              <div className="field"><label htmlFor="en-file">Arquivo(s)</label><input id="en-file" type="file" name="arquivos" multiple required /></div>
              <div><Submit className="btn sm" pendingText="Enviando…">Adicionar à entrega</Submit></div>
            </form>
          </section>
        </div>

        <div className="stack">
          <section className="panel">
            <span className="label">Link do cliente</span>
            {!p.clientAccess && <p className="msg-err">O acesso do cliente está pausado. {me.role === 'adm' ? <Link href="/estudio/configuracoes">Liberar em Configurações</Link> : 'Fale com a adm para liberar.'}</p>}
            <CopyLink url={link} />
            <p className="muted small" style={{ marginTop: 10 }}>Quem tiver este link vê o projeto. Envie só para o cliente.</p>
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
            {me.role === 'adm' && <details className="danger" style={{ marginTop: 20 }}>
              <summary>Excluir projeto</summary>
              <form action={deleteProject} className="form" style={{ marginTop: 10 }}>
                <input type="hidden" name="id" value={p.id} />
                <div className="field"><label htmlFor="del">Digite “{p.brandName}” para confirmar. Isso apaga o projeto e todos os arquivos.</label><input id="del" name="confirm" autoComplete="off" /></div>
                <div><button className="btn sm danger" type="submit">Excluir de vez</button></div>
              </form>
            </details>}
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

function ImageInput({ name, current, label }) {
  return (
    <div className="row small" style={{ gap: 10 }}>
      <input type="hidden" form="pres-form" name={`${name}old`} value={current || ''} />
      <input type="file" form="pres-form" name={name} accept="image/*" aria-label={label} style={{ maxWidth: '100%' }} />
      {current && <label className="row" style={{ gap: 4 }}><input type="checkbox" form="pres-form" name={`${name}del`} value="1" /> tirar imagem</label>}
    </div>
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
