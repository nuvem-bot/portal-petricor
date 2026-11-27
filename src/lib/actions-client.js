'use server';
import { revalidatePath } from 'next/cache';
import { db } from './db';
import { projectByToken } from './auth';
import { answersFromForm } from './briefing';
import { mailTeam, mailClientDecision } from './mail';

const str = (fd, k, max = 4000) => String(fd.get(k) ?? '').trim().slice(0, max);
const log = (projectId, text) => db.event.create({ data: { projectId, actor: 'cliente', text } });

async function project(fd) {
  const p = await projectByToken(str(fd, 'token', 60));
  if (!p) throw new Error('Link inválido.');
  return p;
}

export async function saveBriefing(_, fd) {
  const p = await project(fd);
  const { answers, missing, tooMany } = answersFromForm(fd);
  if (tooMany) return { error: `Escolha no máximo ${tooMany.max} em “${tooMany.label}”.` };
  const final = fd.get('enviar') === '1';
  if (final && missing.length) return { error: `Falta responder: ${missing.map((q) => q.label).join(', ')}.` };
  const first = final && !p.briefingAt;
  await db.project.update({ where: { id: p.id }, data: { briefing: JSON.stringify(answers), ...(final ? { briefingAt: new Date() } : {}) } });
  if (first) {
    await log(p.id, `${p.clientName} enviou o briefing`);
    await mailTeam(p, { subject: `${p.brandName}: briefing recebido`, title: 'O cliente respondeu o briefing', paragraphs: [`${p.clientName} enviou o briefing de ${p.brandName}. As respostas já estão no projeto.`] });
  }
  revalidatePath(`/p/${p.token}`, 'layout');
  return { ok: final ? 'Briefing enviado. A designer já foi avisada.' : 'Rascunho salvo.' };
}

export async function saveMoodNote(fd) {
  const p = await project(fd);
  const item = await db.moodItem.findUnique({ where: { id: str(fd, 'itemId', 40) } });
  if (!item || item.projectId !== p.id || p.moodSentAt) return;
  const data = {};
  if (fd.has('liked')) data.liked = str(fd, 'liked', 600) || null;
  if (fd.has('disliked')) data.disliked = str(fd, 'disliked', 600) || null;
  await db.moodItem.update({ where: { id: item.id }, data });
}

export async function sendMood(fd) {
  const p = await project(fd);
  if (p.moodSentAt) return { error: 'O feedback já foi enviado.' };
  const items = await db.moodItem.findMany({ where: { projectId: p.id } });
  const pending = items.filter((i) => !i.liked || !i.disliked).length;
  if (pending) {
    return { error: pending === 1
      ? 'Falta escrever o que gostou e o que não gostou em 1 imagem.'
      : `Falta escrever o que gostou e o que não gostou em ${pending} imagens.` };
  }
  await db.project.update({ where: { id: p.id }, data: { moodSentAt: new Date() } });
  await log(p.id, `${p.clientName} enviou o feedback do moodboard (${items.length} imagens comentadas)`);
  await mailTeam(p, { subject: `${p.brandName}: feedback do moodboard`, title: 'O cliente comentou o moodboard', paragraphs: [`${p.clientName} escreveu o que gostou e o que não gostou nas ${items.length} referências de ${p.brandName}.`] });
  revalidatePath(`/p/${p.token}`, 'layout');
  return { ok: true };
}

export async function decide(_, fd) {
  const p = await project(fd);
  if (p.stage !== 'proposta' || !p.publishedAt || p.decision) return { error: 'Esta proposta já foi respondida.' };
  const d = str(fd, 'decision', 10);
  const note = str(fd, 'note', 2000);
  if (d === 'ajustes' && !note) return { error: 'Conte o que você quer ajustar.' };
  if (d === 'ajustes' && p.roundsUsed >= p.roundsIncluded) {
    return { error: 'As rodadas de ajuste incluídas já foram usadas. Fale com a designer.' };
  }
  if (!['aprovado', 'ajustes'].includes(d)) return { error: 'Escolha uma opção.' };
  const v = await db.proposalVersion.findFirst({ where: { projectId: p.id }, orderBy: { number: 'desc' } });
  if (v) await db.proposalVersion.update({ where: { id: v.id }, data: { decision: d, decisionNote: note || null, decisionAt: new Date() } });
  await db.project.update({
    where: { id: p.id },
    data: {
      decision: d, decisionNote: note || null, decisionAt: new Date(),
      ...(d === 'aprovado' ? { stage: 'finalizacao' } : { roundsUsed: { increment: 1 } }),
    },
  });
  await log(p.id, d === 'aprovado' ? `${p.clientName} aprovou a versão ${v?.number || 1}` : `${p.clientName} pediu ajustes na versão ${v?.number || 1}: “${note}”`);
  await mailTeam(p, d === 'aprovado'
    ? { subject: `${p.brandName}: identidade aprovada!`, title: 'O cliente aprovou a identidade', paragraphs: [`${p.clientName} aprovou a versão ${v?.number || 1} de ${p.brandName}. O projeto foi para Finalização.`], quote: note || undefined }
    : { subject: `${p.brandName}: pedido de ajustes na versão ${v?.number || 1}`, title: 'O cliente pediu ajustes', paragraphs: [`${p.clientName} pediu ajustes na versão ${v?.number || 1} de ${p.brandName}:`], quote: note });
  await mailClientDecision(p, d);
  revalidatePath(`/p/${p.token}`, 'layout');
  return { ok: d };
}
