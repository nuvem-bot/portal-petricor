'use server';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from './db';
import { requireDesigner, startSession, endSession, newToken } from './auth';
import { saveUpload, removeUpload } from './files';
import { labelFromFile, cleanName } from './names';
import { STAGES } from './stages';
import { answersFromForm } from './briefing';
import { isHex, safeFont, EMPTY_PRESENTATION, COVERS, draftSnapshot, BUILD_SLOTS, MAX_COLORS, MAX_FONTS, LOGO_VERSIONS, WEIGHTS } from './presentation';

const str = (fd, k, max = 4000) => String(fd.get(k) ?? '').trim().slice(0, max);
const log = (projectId, text) => db.event.create({ data: { projectId, actor: 'estudio', text } });
const back = (id) => revalidatePath(`/estudio/projetos/${id}`);

export async function login(_, fd) {
  const email = str(fd, 'email', 200).toLowerCase();
  const d = await db.designer.findUnique({ where: { email } });
  if (!d || !(await bcrypt.compare(str(fd, 'senha', 200), d.passwordHash))) {
    return { error: 'E-mail ou senha incorretos.' };
  }
  if (!d.active) return { error: 'Seu acesso está desativado. Fale com a administração do estúdio.' };
  startSession(d.id);
  redirect('/estudio');
}

export async function logout() {
  endSession();
  redirect('/login');
}

export async function createProject(_, fd) {
  const me = await requireDesigner();
  const brandName = str(fd, 'brandName', 120);
  const clientName = str(fd, 'clientName', 120);
  if (!brandName || !clientName) return { error: 'Preencha o nome da marca e do cliente.' };
  const due = str(fd, 'dueDate', 20);
  const p = await db.project.create({
    data: {
      brandName, clientName,
      clientEmail: str(fd, 'clientEmail', 200) || null,
      dueDate: due ? new Date(`${due}T12:00:00`) : null,
      token: newToken(),
      designerId: me.id,
    },
  });
  await log(p.id, `${me.name} criou o projeto`);
  redirect(`/estudio/projetos/${p.id}`);
}

async function own(id) {
  const me = await requireDesigner();
  const p = await db.project.findUnique({ where: { id } });
  if (!p) throw new Error('Projeto não encontrado.');
  return { me, p };
}

export async function setStage(fd) {
  const { me, p } = await own(str(fd, 'id', 40));
  const stage = str(fd, 'stage', 30);
  if (!STAGES.some((s) => s.id === stage)) return;
  const data = { stage };
  await db.project.update({ where: { id: p.id }, data });
  await log(p.id, `${me.name} moveu o projeto para ${STAGES.find((s) => s.id === stage).name}`);
  back(p.id);
}

export async function updateProject(fd) {
  const { p } = await own(str(fd, 'id', 40));
  const due = str(fd, 'dueDate', 20);
  await db.project.update({
    where: { id: p.id },
    data: {
      brandName: str(fd, 'brandName', 120) || p.brandName,
      clientName: str(fd, 'clientName', 120) || p.clientName,
      clientEmail: str(fd, 'clientEmail', 200) || null,
      dueDate: due ? new Date(`${due}T12:00:00`) : null,
      roundsIncluded: Math.max(0, Math.min(10, Number(fd.get('roundsIncluded')) || 0)),
    },
  });
  back(p.id);
}

export async function regenerateLink(fd) {
  const { me, p } = await own(str(fd, 'id', 40));
  await db.project.update({ where: { id: p.id }, data: { token: newToken() } });
  await log(p.id, `${me.name} gerou um novo link para o cliente`);
  back(p.id);
}

export async function addMoodItems(fd) {
  const { me, p } = await own(str(fd, 'id', 40));
  const files = fd.getAll('imagens');
  const last = await db.moodItem.count({ where: { projectId: p.id } });
  let n = 0;
  for (const f of files) {
    const saved = await saveUpload(p.id, f);
    if (!saved) continue;
    await db.moodItem.create({ data: { projectId: p.id, file: saved.rel, position: last + n } });
    n++;
  }
  if (n) await log(p.id, `${me.name} adicionou ${n} ${n === 1 ? 'imagem' : 'imagens'} ao moodboard`);
  back(p.id);
}

// A designer sobe um briefing que o cliente já respondeu fora do portal (ex.: no Respondi)
export async function studioSaveBriefing(_, fd) {
  const { me, p } = await own(str(fd, 'id', 40));
  const { answers, tooMany } = answersFromForm(fd);
  if (tooMany) return { error: `Escolha no máximo ${tooMany.max} em “${tooMany.label}”.` };
  let files = 0;
  try {
    const last = await db.asset.count({ where: { projectId: p.id, kind: 'briefing' } });
    for (const f of fd.getAll('arquivos')) {
      const saved = await saveUpload(p.id, f);
      if (!saved) continue;
      await db.asset.create({ data: { projectId: p.id, kind: 'briefing', file: saved.rel, size: saved.size, position: last + files, label: labelFromFile(f.name) } });
      files++;
    }
  } catch (e) { return { error: e.message }; }
  await db.project.update({ where: { id: p.id }, data: { briefing: JSON.stringify(answers), briefingAt: p.briefingAt || new Date() } });
  await log(p.id, `${me.name} subiu o briefing do cliente${files ? ` (com ${files} ${files === 1 ? 'arquivo' : 'arquivos'})` : ''}`);
  back(p.id);
  return { ok: 'Briefing salvo. O cliente vê essas respostas como já enviadas.' };
}

// A designer registra o que o cliente já comentou numa imagem (ex.: no Notion)
export async function studioMoodNote(fd) {
  const item = await db.moodItem.findUnique({ where: { id: str(fd, 'itemId', 40) } });
  if (!item) return;
  await own(item.projectId);
  await db.moodItem.update({ where: { id: item.id }, data: { liked: str(fd, 'liked', 600) || null, disliked: str(fd, 'disliked', 600) || null } });
  back(item.projectId);
}

// Marca o feedback do moodboard como recebido (quando ele foi dado fora do portal)
export async function studioMoodReceived(fd) {
  const { me, p } = await own(str(fd, 'id', 40));
  if (p.moodSentAt) return;
  await db.project.update({ where: { id: p.id }, data: { moodSentAt: new Date() } });
  await log(p.id, `${me.name} marcou o feedback do moodboard como recebido`);
  back(p.id);
}

export async function updateMoodCaption(fd) {
  const item = await db.moodItem.findUnique({ where: { id: str(fd, 'itemId', 40) } });
  if (!item) return;
  await own(item.projectId);
  await db.moodItem.update({ where: { id: item.id }, data: { caption: str(fd, 'caption', 200) || null } });
  back(item.projectId);
}

export async function deleteMoodItem(fd) {
  const item = await db.moodItem.findUnique({ where: { id: str(fd, 'itemId', 40) } });
  if (!item) return;
  await own(item.projectId);
  await db.moodItem.delete({ where: { id: item.id } });
  await removeUpload(item.file);
  back(item.projectId);
}

// Campo de imagem do formulário da apresentação: <key> (arquivo novo), <key>old (atual), <key>del (tirar)
async function imageField(fd, key, projectId) {
  let img = str(fd, `${key}old`, 200);
  if (img && !img.startsWith(`${projectId}/`)) img = '';
  if (fd.get(`${key}del`) === '1') img = '';
  const f = fd.get(key);
  if (f && typeof f !== 'string' && f.size) {
    if (!/\.(png|jpe?g|webp|gif|svg)$/i.test(f.name || '')) throw new Error('Envie imagens (PNG, JPG, SVG ou WebP).');
    img = (await saveUpload(projectId, f)).rel;
  }
  return img || null;
}

// Etapas da construção da marca: título, texto e imagem
async function buildFromForm(fd, projectId) {
  const steps = [];
  for (let i = 0; i < BUILD_SLOTS; i++) {
    const img = await imageField(fd, `bimg${i}`, projectId);
    const t = str(fd, `bt${i}`, 80), d = str(fd, `bd${i}`, 300);
    if (t || d || img) steps.push({ t, d, img });
  }
  return steps;
}

async function presentationFromForm(fd, projectId) {
  const palette = [];
  for (let i = 0; i < MAX_COLORS; i++) {
    if (i >= 4 && !fd.has(`ch${i}`)) continue;
    const hex = str(fd, `ch${i}`, 7);
    palette.push({
      name: str(fd, `cn${i}`, 40),
      hex: isHex(hex) ? hex : (EMPTY_PRESENTATION.palette[i]?.hex || '#888888'),
      note: str(fd, `cd${i}`, 140),
    });
  }
  const fonts = [];
  for (let i = 0; i < MAX_FONTS; i++) {
    const family = safeFont(str(fd, `ff${i}`, 40), '');
    if (!family) continue;
    fonts.push({
      role: str(fd, `fr${i}`, 40), family,
      weight: WEIGHTS.includes(str(fd, `fw${i}`, 3)) ? str(fd, `fw${i}`, 3) : '400',
      note: str(fd, `fn${i}`, 120), sample: str(fd, `fs${i}`, 200),
    });
  }
  if (!fonts.length) fonts.push(...EMPTY_PRESENTATION.fonts);
  const logoVersions = [];
  for (let i = 0; i < LOGO_VERSIONS; i++) {
    const img = await imageField(fd, `lv${i}`, projectId);
    const bg = str(fd, `lvbg${i}`, 7);
    if (img) logoVersions.push({ img, bg: isHex(bg) ? bg : '#FFFFFF' });
  }
  return {
    ...EMPTY_PRESENTATION,
    title: str(fd, 'title', 200),
    concept: str(fd, 'concept', 1000),
    conceptText: str(fd, 'conceptText', 4000),
    buildTitle: str(fd, 'buildTitle', 60) || EMPTY_PRESENTATION.buildTitle,
    build: await buildFromForm(fd, projectId),
    gridImg: await imageField(fd, 'grid', projectId),
    logoVersions,
    palette,
    fonts,
    displayFont: fonts[0].family,
    bodyFont: fonts[fonts.length - 1].family,
    typeNote: str(fd, 'typeNote', 400),
    closing: str(fd, 'closing', 120) || EMPTY_PRESENTATION.closing,
    cover: COVERS.some((c) => c.id === str(fd, 'cover', 20)) ? str(fd, 'cover', 20) : 'liso',
  };
}

// Salva só o rascunho. O cliente continua vendo a última versão liberada (ou nada).
export async function savePresentation(fd) {
  const { p } = await own(str(fd, 'id', 40));
  await db.project.update({ where: { id: p.id }, data: { presentation: JSON.stringify(await presentationFromForm(fd, p.id)) } });
  back(p.id);
}

// Salva e libera a apresentação para o cliente: tira uma foto do rascunho e dos arquivos
// e move o projeto para a etapa Proposta, aguardando a resposta dele.
export async function publishPresentation(fd) {
  const { me, p } = await own(str(fd, 'id', 40));
  const pres = await presentationFromForm(fd, p.id);
  const assets = await db.asset.findMany({ where: { projectId: p.id }, orderBy: { position: 'asc' } });
  const snap = draftSnapshot({ presentation: JSON.stringify(pres), assets });
  const last = await db.proposalVersion.findFirst({ where: { projectId: p.id }, orderBy: { number: 'desc' } });
  const number = (last?.number || 0) + 1;
  await db.proposalVersion.create({ data: { projectId: p.id, number, snapshot: JSON.stringify(snap) } });
  await db.project.update({
    where: { id: p.id },
    data: {
      presentation: JSON.stringify(pres),
      publishedAt: new Date(),
      stage: 'proposta',
      proposalSentAt: new Date(),
      decision: null, decisionNote: null, decisionAt: null,
    },
  });
  await log(p.id, `${me.name} liberou a versão ${number} da proposta para o cliente`);
  back(p.id);
}

export async function addAssets(fd) {
  const { me, p } = await own(str(fd, 'id', 40));
  const kind = str(fd, 'kind', 20);
  if (!['logo', 'mockup', 'grafismo', 'entrega'].includes(kind)) return;
  const files = fd.getAll('arquivos');
  const label = str(fd, 'label', 120);
  const last = await db.asset.count({ where: { projectId: p.id, kind } });
  let n = 0;
  for (const f of files) {
    const saved = await saveUpload(p.id, f);
    if (!saved) continue;
    await db.asset.create({
      data: { projectId: p.id, kind, file: saved.rel, size: saved.size, position: last + n, label: (files.length === 1 && label) || labelFromFile(f.name) },
    });
    n++;
  }
  if (n && kind === 'entrega') await log(p.id, `${me.name} adicionou ${n} ${n === 1 ? 'arquivo' : 'arquivos'} à entrega`);
  back(p.id);
}

export async function renameAsset(fd) {
  const a = await db.asset.findUnique({ where: { id: str(fd, 'assetId', 40) } });
  if (!a) return;
  await own(a.projectId);
  const label = cleanName(str(fd, 'label', 120));
  if (!label || label === a.label) return;
  await db.asset.update({ where: { id: a.id }, data: { label } });
  back(a.projectId);
}

export async function deleteAsset(fd) {
  const a = await db.asset.findUnique({ where: { id: str(fd, 'assetId', 40) } });
  if (!a) return;
  await own(a.projectId);
  await db.asset.delete({ where: { id: a.id } });
  await removeUpload(a.file);
  back(a.projectId);
}

export async function postNote(fd) {
  const { me, p } = await own(str(fd, 'id', 40));
  const text = str(fd, 'text', 1000);
  if (!text) return;
  await db.event.create({ data: { projectId: p.id, actor: 'estudio', text: `${me.name}: ${text}` } });
  back(p.id);
}

export async function deleteProject(fd) {
  const { me, p } = await own(str(fd, 'id', 40));
  if (me.role !== 'adm') return;
  if (str(fd, 'confirm', 200) !== p.brandName) return;
  const files = [...(await db.moodItem.findMany({ where: { projectId: p.id } })), ...(await db.asset.findMany({ where: { projectId: p.id } }))];
  await db.project.delete({ where: { id: p.id } });
  for (const f of files) await removeUpload(f.file);
  redirect('/estudio');
}
