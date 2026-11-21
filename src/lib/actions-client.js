'use server';
import { revalidatePath } from 'next/cache';
import { db } from './db';
import { projectByToken } from './auth';
import { QUESTIONS } from './briefing';

const str = (fd, k, max = 4000) => String(fd.get(k) ?? '').trim().slice(0, max);
const log = (projectId, text) => db.event.create({ data: { projectId, actor: 'cliente', text } });

async function project(fd) {
  const p = await projectByToken(str(fd, 'token', 60));
  if (!p) throw new Error('Link inválido.');
  return p;
}

export async function saveBriefing(_, fd) {
  const p = await project(fd);
  const answers = {};
  for (const q of QUESTIONS) {
    if (q.type === 'chips') answers[q.id] = fd.getAll(q.id).map(String).filter((v) => q.options.includes(v)).slice(0, q.max);
    else answers[q.id] = str(fd, q.id, 3000);
  }
  const missing = QUESTIONS.filter((q) => q.required && !answers[q.id]);
  const final = fd.get('enviar') === '1';
  if (final && missing.length) return { error: `Falta responder: ${missing.map((q) => q.label).join(', ')}.` };
  const first = final && !p.briefingAt;
  await db.project.update({ where: { id: p.id }, data: { briefing: JSON.stringify(answers), ...(final ? { briefingAt: new Date() } : {}) } });
  if (first) await log(p.id, `${p.clientName} enviou o briefing`);
  revalidatePath(`/p/${p.token}`, 'layout');
  return { ok: final ? 'Briefing enviado. A designer já foi avisada.' : 'Rascunho salvo.' };
}

export async function reactMood(fd) {
  const p = await project(fd);
  const item = await db.moodItem.findUnique({ where: { id: str(fd, 'itemId', 40) } });
  if (!item || item.projectId !== p.id || p.moodSentAt) return;
  const r = str(fd, 'reaction', 10);
  await db.moodItem.update({
    where: { id: item.id },
    data: {
      reaction: ['gostei', 'nao'].includes(r) ? r : null,
      ...(fd.has('comment') ? { comment: str(fd, 'comment', 600) || null } : {}),
    },
  });
}

export async function sendMood(fd) {
  const p = await project(fd);
  if (p.moodSentAt) return { error: 'O feedback já foi enviado.' };
  const items = await db.moodItem.findMany({ where: { projectId: p.id } });
  const pending = items.filter((i) => !i.reaction).length;
  if (pending) return { error: pending === 1 ? "Ainda falta 1 imagem." : `Ainda faltam ${pending} imagens.` };
  await db.project.update({ where: { id: p.id }, data: { moodSentAt: new Date() } });
  const liked = items.filter((i) => i.reaction === 'gostei').length;
  await log(p.id, `${p.clientName} enviou o feedback do moodboard (${liked} gostei, ${items.length - liked} não)`);
  revalidatePath(`/p/${p.token}`, 'layout');
  return { ok: true };
}

export async function decide(_, fd) {
  const p = await project(fd);
  if (p.stage !== 'proposta' || p.decision) return { error: 'Esta proposta já foi respondida.' };
  const d = str(fd, 'decision', 10);
  const note = str(fd, 'note', 2000);
  if (d === 'ajustes' && !note) return { error: 'Conte o que você quer ajustar.' };
  if (d === 'ajustes' && p.roundsUsed >= p.roundsIncluded) {
    return { error: 'As rodadas de ajuste incluídas já foram usadas. Fale com a designer.' };
  }
  if (!['aprovado', 'ajustes'].includes(d)) return { error: 'Escolha uma opção.' };
  await db.project.update({
    where: { id: p.id },
    data: {
      decision: d, decisionNote: note || null, decisionAt: new Date(),
      ...(d === 'aprovado' ? { stage: 'finalizacao' } : { roundsUsed: { increment: 1 } }),
    },
  });
  await log(p.id, d === 'aprovado' ? `${p.clientName} aprovou a identidade` : `${p.clientName} pediu ajustes: “${note}”`);
  revalidatePath(`/p/${p.token}`, 'layout');
  return { ok: d };
}
