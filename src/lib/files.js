import 'server-only';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = /\.(png|jpe?g|webp|gif|svg|pdf|zip|ai|eps|ase|otf|ttf|woff2?|mp4)$/i;

// Salva um arquivo enviado em uploads/<projectId>/ e retorna o caminho relativo.
export async function saveUpload(projectId, file) {
  if (!file || typeof file === 'string' || !file.size) return null;
  if (file.size > MAX_BYTES) throw new Error('Arquivo maior que 25 MB.');
  const ext = path.extname(file.name || '').toLowerCase();
  if (!ALLOWED.test(ext)) throw new Error(`Tipo de arquivo não aceito: ${ext || 'sem extensão'}`);
  const dir = path.join(UPLOAD_DIR, projectId);
  await fs.mkdir(dir, { recursive: true });
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return { rel: `${projectId}/${name}`, size: file.size };
}

export async function removeUpload(rel) {
  if (!rel) return;
  const full = path.resolve(UPLOAD_DIR, rel);
  if (!full.startsWith(UPLOAD_DIR + path.sep)) return;
  await fs.rm(full, { force: true });
}

export const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.zip': 'application/zip', '.mp4': 'video/mp4',
};
