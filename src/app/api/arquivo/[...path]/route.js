import path from 'node:path';
import fs from 'node:fs/promises';
import { db } from '@/lib/db';
import { currentDesigner, projectByToken } from '@/lib/auth';
import { UPLOAD_DIR, MIME } from '@/lib/files';

// Serve um arquivo enviado. Acesso: designer logada, ou o cliente com o token do próprio projeto.
export async function GET(req, { params }) {
  const rel = params.path.join('/');
  const projectId = params.path[0];
  const full = path.resolve(UPLOAD_DIR, rel);
  if (!full.startsWith(UPLOAD_DIR + path.sep)) return new Response('Não encontrado', { status: 404 });

  const url = new URL(req.url);
  let allowed = !!(await currentDesigner());
  if (!allowed) {
    const p = await projectByToken(url.searchParams.get('t'));
    if (p && p.id === projectId) {
      const asset = await db.asset.findFirst({ where: { projectId, file: rel } });
      allowed = !asset || asset.kind !== 'entrega' || p.stage === 'entrega';
    }
  }
  if (!allowed) return new Response('Sem acesso', { status: 403 });

  try {
    const buf = await fs.readFile(full);
    const ext = path.extname(full).toLowerCase();
    const headers = {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    };
    if (ext === '.svg') headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'";
    const name = url.searchParams.get('nome');
    if (url.searchParams.has('baixar')) {
      headers['Content-Disposition'] = `attachment; filename*=UTF-8''${encodeURIComponent((name || path.basename(full)).replace(/[\r\n"]/g, ''))}${name && !path.extname(name) ? ext : ''}`;
    }
    return new Response(buf, { headers });
  } catch {
    return new Response('Não encontrado', { status: 404 });
  }
}
