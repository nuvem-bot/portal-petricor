'use server';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { db } from './db';
import { requireAdmin, newToken } from './auth';

const str = (fd, k, max = 200) => String(fd.get(k) ?? '').trim().slice(0, max);
const ROLES = ['adm', 'equipe'];
const done = () => revalidatePath('/estudio/configuracoes');

// Nunca deixar o estúdio sem nenhuma adm ativa
async function lastAdmin(id) {
  const others = await db.designer.count({ where: { role: 'adm', active: true, NOT: { id } } });
  return others === 0;
}

export async function addPerson(_, fd) {
  await requireAdmin();
  const name = str(fd, 'name', 120);
  const email = str(fd, 'email').toLowerCase();
  const role = ROLES.includes(str(fd, 'role')) ? str(fd, 'role') : 'equipe';
  const senha = str(fd, 'senha');
  if (!name || !email) return { error: 'Preencha nome e e-mail.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'E-mail inválido.' };
  if (senha.length < 10) return { error: 'A senha precisa ter pelo menos 10 caracteres.' };
  if (await db.designer.findUnique({ where: { email } })) return { error: 'Já existe alguém com esse e-mail.' };
  await db.designer.create({ data: { name, email, role, passwordHash: await bcrypt.hash(senha, 12) } });
  done();
  return { ok: `Acesso criado para ${name}. Passe o e-mail e a senha para a pessoa entrar em /login.` };
}

export async function setRole(fd) {
  const me = await requireAdmin();
  const id = str(fd, 'id', 40);
  const role = str(fd, 'role');
  if (!ROLES.includes(role) || id === me.id) return;
  if (role !== 'adm' && (await lastAdmin(id))) return;
  await db.designer.update({ where: { id }, data: { role } });
  done();
}

export async function setActive(fd) {
  const me = await requireAdmin();
  const id = str(fd, 'id', 40);
  const active = str(fd, 'active') === '1';
  if (id === me.id) return;
  if (!active && (await lastAdmin(id))) return;
  await db.designer.update({ where: { id }, data: active ? { active } : { active, sessionsFrom: new Date() } });
  done();
}

export async function resetPassword(_, fd) {
  await requireAdmin();
  const id = str(fd, 'id', 40);
  const senha = str(fd, 'senha');
  if (senha.length < 10) return { error: 'A senha precisa ter pelo menos 10 caracteres.' };
  await db.designer.update({ where: { id }, data: { passwordHash: await bcrypt.hash(senha, 12), sessionsFrom: new Date() } });
  return { ok: 'Senha trocada. Avise a pessoa da nova senha.' };
}

export async function setClientAccess(fd) {
  const me = await requireAdmin();
  const id = str(fd, 'id', 40);
  const on = str(fd, 'on') === '1';
  const p = await db.project.update({ where: { id }, data: { clientAccess: on } });
  await db.event.create({ data: { projectId: p.id, actor: 'estudio', text: `${me.name} ${on ? 'liberou' : 'pausou'} o acesso do cliente` } });
  done();
}

export async function newClientLink(fd) {
  const me = await requireAdmin();
  const p = await db.project.update({ where: { id: str(fd, 'id', 40) }, data: { token: newToken() } });
  await db.event.create({ data: { projectId: p.id, actor: 'estudio', text: `${me.name} gerou um novo link para o cliente` } });
  done();
}
