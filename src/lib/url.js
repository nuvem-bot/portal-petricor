// Monta a URL de um arquivo enviado. Para o cliente, inclui o token do link.
export function fileUrl(rel, token, opts = {}) {
  const q = new URLSearchParams();
  if (token) q.set('t', token);
  if (opts.download) { q.set('baixar', '1'); if (opts.name) q.set('nome', opts.name); }
  const qs = q.toString();
  return `/api/arquivo/${rel}${qs ? `?${qs}` : ''}`;
}

export const fmtDate = (d, opts = { day: '2-digit', month: 'short' }) =>
  d ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', ...opts }).format(new Date(d)).replace('.', '') : '—';

export const fmtDateTime = (d) =>
  d ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(d)).replace('.', '') : '—';

export function fmtSize(b) {
  if (!b) return '';
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}
