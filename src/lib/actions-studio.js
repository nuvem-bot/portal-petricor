'use server';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from './db';
import { requireDesigner, startSession, endSession, newToken } from './auth';
import { saveUpload, removeUpload } from './files';
import { STAGES } from './stages';
import { isHex, safeFont, EMPTY_PRESENTATION } from './presentation';

const str = (fd, k, max = 4000) => String(fd.get(k) ?? '').trim().slice(0, max);
const log = (projectId, text) => db.event.create({ data: { projectId, actor: 'estudio', text } });
const back = (id) => revalidatePath(`/estudio/projetos/${id}`);

export async function login(_, fd) {
  const email = str(fd, 'email', 200).toLowerCase();
  const d = await db.designer.findUnique({ where: { email } });
  if (!d || !(await bcrypt.compare(str(fd, 'senha', 200), d.passwordHash))) {
    return { error: 'E-mail ou senha incorretos.' };
  }
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
  if (!brandName || !clientName) return { error: 'Preencha o nome da marca e da cliente.' };
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
  if (stage === 'proposta' && p.stage !== 'proposta') {
    Object.assign(data, { proposalSentAt: new Date(), decision: null, decisionNote: null, decisionAt: null });
  }
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
  await log(p.id, `${me.name} gerou um novo link para a cliente`);
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

export async function savePresentation(fd) {
  const { p } = await own(str(fd, 'id', 40));
  const pres = {
    ...EMPTY_PRESENTATION,
    title: str(fd, 'title', 200),
    concept: str(fd, 'concept', 1000),
    pillars: [0, 1, 2].map((i) => ({ t: str(fd, `pt${i}`, 60), d: str(fd, `pd${i}`, 300) })),
    palette: [0, 1, 2, 3].map((i) => ({
      name: str(fd, `cn${i}`, 40),
      hex: isHex(str(fd, `ch${i}`, 7)) ? str(fd, `ch${i}`, 7) : EMPTY_PRESENTATION.palette[i].hex,
      note: str(fd, `cd${i}`, 140),
    })),
    displayFont: safeFont(str(fd, 'displayFont', 40), 'Fraunces'),
    bodyFont: safeFont(str(fd, 'bodyFont', 40), 'Inter'),
    typeNote: str(fd, 'typeNote', 400),
    closing: str(fd, 'closing', 120) || EMPTY_PRESENTATION.closing,
  };
  await db.project.update({ where: { id: p.id }, data: { presentation: JSON.stringify(pres) } });
  back(p.id);
}

export async function addAssets(fd) {
  const { me, p } = await own(str(fd, 'id', 40));
  const kind = str(fd, 'kind', 20);
  if (!['logo', 'mockup', 'entrega'].includes(kind)) return;
  const files = fd.getAll('arquivos');
  const label = str(fd, 'label', 120);
  const last = await db.asset.count({ where: { projectId: p.id, kind } });
  let n = 0;
  for (const f of files) {
    const saved = await saveUpload(p.id, f);
    if (!saved) continue;
    await db.asset.create({
      data: { projectId: p.id, kind, file: saved.rel, size: saved.size, position: last + n, label: (files.length === 1 && label) || f.name },
    });
    n++;
  }
  if (n && kind === 'entrega') await log(p.id, `${me.name} adicionou ${n} ${n === 1 ? 'arquivo' : 'arquivos'} à entrega`);
  back(p.id);
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
  const { p } = await own(str(fd, 'id', 40));
  if (str(fd, 'confirm', 200) !== p.brandName) return;
  const files = [...(await db.moodItem.findMany({ where: { projectId: p.id } })), ...(await db.asset.findMany({ where: { projectId: p.id } }))];
  await db.project.delete({ where: { id: p.id } });
  for (const f of files) await removeUpload(f.file);
  redirect('/estudio');
}
