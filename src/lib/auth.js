import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';

const COOKIE = 'ptc_sessao';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET precisa ter pelo menos 32 caracteres.');
  return s;
}
function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

export function startSession(designerId) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `${designerId}.${exp}`;
  cookies().set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: MAX_AGE,
  });
}

export function endSession() {
  cookies().delete(COOKIE);
}

export async function currentDesigner() {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return null;
  const [id, exp, sig] = raw.split('.');
  if (!id || !exp || !sig) return null;
  const expected = sign(`${id}.${exp}`);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return db.designer.findUnique({ where: { id }, select: { id: true, name: true, email: true } });
}

export async function requireDesigner() {
  const d = await currentDesigner();
  if (!d) redirect('/login');
  return d;
}

export function newToken() {
  return crypto.randomBytes(18).toString('base64url');
}

// Projeto do cliente pelo link secreto. Retorna null se não existir.
export async function projectByToken(token) {
  if (!token || token.length < 16) return null;
  return db.project.findUnique({ where: { token } });
}
