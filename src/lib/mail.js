import 'server-only';
import nodemailer from 'nodemailer';
import { db } from './db';

// Envio de e-mails do portal. Configure no .env:
//   SMTP_HOST, SMTP_PORT (465 ou 587), SMTP_USER, SMTP_PASS, MAIL_FROM
// Sem SMTP configurado, nada é enviado (só registra no log do servidor).

const BASE = () => (process.env.PUBLIC_URL || 'https://portal.estudiopetricor.com.br').replace(/\/$/, '');
export const mailReady = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transport;
function getTransport() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 465);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST, port, secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    });
  }
  return transport;
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Monta o e-mail no visual da Petricor. paragraphs: lista de textos (sem HTML).
function render({ title, paragraphs = [], quote, button, footer }) {
  const ps = paragraphs.filter(Boolean);
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#F3F3F7;font-family:Arial,Helvetica,sans-serif;color:#0E1030">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F3F7;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden">
<tr><td style="background:#0E1030;padding:22px 32px"><img src="${BASE()}/marca/petricor-branco.png" alt="Petricor" height="30" style="display:block;height:30px;border:0"></td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#0E1030">${esc(title)}</h1>
${ps.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#33354F">${esc(p)}</p>`).join('\n')}
${quote ? `<blockquote style="margin:4px 0 18px;padding:12px 16px;border-left:3px solid #957BFC;background:#F3F1FE;font-size:15px;line-height:1.55;color:#0E1030">${esc(quote).replace(/\n/g, '<br>')}</blockquote>` : ''}
${button ? `<p style="margin:24px 0 8px"><a href="${esc(button.url)}" style="display:inline-block;background:#4F2BCD;color:#FFFFFF;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 24px;border-radius:999px">${esc(button.label)}</a></p>
<p style="margin:10px 0 0;font-size:12px;color:#8A8CA3">Se o botão não abrir, copie este endereço: ${esc(button.url)}</p>` : ''}
</td></tr>
<tr><td style="padding:18px 32px;border-top:1px solid #E9E8F0;font-size:12px;line-height:1.5;color:#8A8CA3">${esc(footer || 'Petricor Estúdio · estudiopetricor.com.br')}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [title, '', ...ps, quote ? `"${quote}"` : '', button ? `${button.label}: ${button.url}` : '', '', footer || 'Petricor Estúdio'].filter((l, i, a) => l || a[i - 1]).join('\n');
  return { html, text };
}

// Envia sem nunca derrubar a ação que chamou. Retorna true se foi enviado.
export async function sendMail({ to, subject, replyTo, ...content }) {
  const list = [].concat(to || []).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || ''));
  if (!list.length) return false;
  if (!mailReady()) { console.log(`[e-mail não configurado] ${subject} → ${list.join(', ')}`); return false; }
  const { html, text } = render({ title: content.title || subject, ...content });
  try {
    await getTransport().sendMail({
      from: process.env.MAIL_FROM || `Petricor Estúdio <${process.env.SMTP_USER}>`,
      to: list.join(', '), subject, html, text,
      ...(replyTo ? { replyTo } : process.env.MAIL_REPLY_TO ? { replyTo: process.env.MAIL_REPLY_TO } : {}),
    });
    return true;
  } catch (e) {
    console.error('[e-mail] falhou:', subject, e?.message);
    return false;
  }
}

const clientLink = (p, path = '') => `${BASE()}/p/${p.token}${path}`;
const studioLink = (p) => `${BASE()}/estudio/projetos/${p.id}`;
const note = (projectId, text) => db.event.create({ data: { projectId, actor: 'estudio', text } }).catch(() => {});

// ── Cliente ─────────────────────────────────────────────────────────────
const STAGE_MAIL = {
  briefing: (p) => ({
    subject: `${p.brandName}: vamos começar pelo briefing`,
    title: 'Vamos começar pelo briefing',
    paragraphs: [`Olá, ${p.clientName}!`, 'Seu portal da identidade visual está pronto. O primeiro passo é o briefing: são algumas perguntas sobre a marca, e você pode salvar e continuar depois.'],
    button: { label: 'Responder o briefing', url: clientLink(p, '/briefing') },
  }),
  moodboard: (p) => ({
    subject: `${p.brandName}: o moodboard está pronto`,
    title: 'O moodboard está pronto para você',
    paragraphs: [`Olá, ${p.clientName}!`, 'Separamos as referências visuais para a sua marca. Em cada imagem, conte o que você gostou e o que não gostou. É isso que guia a criação.'],
    button: { label: 'Ver o moodboard', url: clientLink(p, '/moodboard') },
  }),
  criacao: (p) => ({
    subject: `${p.brandName}: começamos a criação`,
    title: 'Começamos a criação',
    paragraphs: [`Olá, ${p.clientName}!`, 'Recebemos tudo o que precisávamos. Agora a designer está desenhando a sua identidade visual. Avisamos por aqui quando a apresentação estiver pronta.'],
    button: { label: 'Acompanhar o projeto', url: clientLink(p) },
  }),
  finalizacao: (p) => ({
    subject: `${p.brandName}: estamos finalizando`,
    title: 'Estamos finalizando a sua marca',
    paragraphs: [`Olá, ${p.clientName}!`, 'A identidade foi aprovada. Agora estamos preparando o manual e os arquivos finais. Você recebe outro e-mail quando estiver tudo pronto para baixar.'],
    button: { label: 'Acompanhar o projeto', url: clientLink(p) },
  }),
  entrega: (p) => ({
    subject: `${p.brandName}: seus arquivos estão prontos`,
    title: 'Sua identidade visual está pronta',
    paragraphs: [`Olá, ${p.clientName}!`, 'Os arquivos finais da sua marca já estão no portal para baixar. Foi muito bom criar com você.'],
    button: { label: 'Baixar os arquivos', url: clientLink(p, '/entrega') },
  }),
};

function canMailClient(p) { return Boolean(p.clientEmail && p.clientAccess && p.notifyClient !== false); }

export async function mailClientStage(p, stage) {
  if (!canMailClient(p) || !STAGE_MAIL[stage]) return;
  if (await sendMail({ to: p.clientEmail, ...STAGE_MAIL[stage](p) })) await note(p.id, `E-mail enviado ao cliente: etapa ${stage}`);
}

export async function mailClientAccess(p, { reason } = {}) {
  if (!p.clientEmail) return false;
  const ok = await sendMail({
    to: p.clientEmail,
    subject: `${p.brandName}: seu acesso ao portal da Petricor`,
    title: reason === 'novo-link' ? 'Seu link do portal mudou' : 'Seu acesso ao portal da Petricor',
    paragraphs: [
      `Olá, ${p.clientName}!`,
      reason === 'novo-link'
        ? 'Geramos um novo link para o portal do seu projeto. O link anterior não funciona mais, use este daqui para frente.'
        : `É por este link que você acompanha a criação da identidade visual de ${p.brandName}: briefing, moodboard, apresentação e arquivos finais.`,
      'O link é pessoal. Guarde este e-mail e não compartilhe o endereço.',
    ],
    button: { label: 'Abrir o portal', url: clientLink(p) },
  });
  if (ok) await note(p.id, 'E-mail com o link enviado ao cliente');
  return ok;
}

export async function mailClientProposal(p, number) {
  if (!canMailClient(p)) return;
  const ok = await sendMail({
    to: p.clientEmail,
    subject: number > 1 ? `${p.brandName}: a versão ${number} está pronta` : `${p.brandName}: sua identidade visual está pronta para ver`,
    title: number > 1 ? `A versão ${number} está pronta` : 'Chegou a hora de ver a sua marca',
    paragraphs: [`Olá, ${p.clientName}!`, number > 1 ? 'Fizemos os ajustes que você pediu. Veja a nova versão e conte o que achou.' : 'A apresentação da sua identidade visual está pronta. Assista com calma e, no final, aprove ou peça ajustes.'],
    button: { label: 'Ver a apresentação', url: clientLink(p, '/apresentacao') },
  });
  if (ok) await note(p.id, `E-mail enviado ao cliente: versão ${number} liberada`);
}

export async function mailClientDecision(p, decision) {
  if (!canMailClient(p)) return;
  if (decision === 'aprovado') return mailClientStage(p, 'finalizacao');
  await sendMail({
    to: p.clientEmail,
    subject: `${p.brandName}: recebemos seus ajustes`,
    title: 'Recebemos seu pedido de ajustes',
    paragraphs: [`Olá, ${p.clientName}!`, 'A designer já recebeu o que você quer mudar. Avisamos por e-mail quando a nova versão estiver pronta.'],
    button: { label: 'Acompanhar o projeto', url: clientLink(p) },
  });
}

// ── Equipe ──────────────────────────────────────────────────────────────
// Vai para a designer do projeto; se ela não estiver ativa, para as adms.
async function teamFor(p) {
  const d = p.designerId ? await db.designer.findUnique({ where: { id: p.designerId } }) : null;
  if (d?.active) return [d.email];
  return (await db.designer.findMany({ where: { role: 'adm', active: true } })).map((x) => x.email);
}

export async function mailTeam(p, { subject, title, paragraphs, quote }) {
  const to = await teamFor(p);
  await sendMail({ to, subject, title, paragraphs, quote, replyTo: p.clientEmail || undefined, button: { label: 'Abrir o projeto', url: studioLink(p) }, footer: 'Aviso automático do portal da Petricor.' });
}

export async function mailWelcomeDesigner({ name, email, role }) {
  return sendMail({
    to: email,
    subject: 'Seu acesso ao portal da Petricor',
    title: `Boas-vindas, ${name}!`,
    paragraphs: [
      `Você recebeu acesso ${role === 'adm' ? 'de administradora' : 'da equipe'} ao portal da Petricor, onde acompanhamos os projetos de identidade visual.`,
      'Entre com este e-mail. A senha é passada pela adm do estúdio, separadamente.',
    ],
    button: { label: 'Entrar no portal', url: `${BASE()}/login` },
  });
}

export async function mailTest(to) {
  return sendMail({
    to, subject: 'Teste de e-mail do portal da Petricor', title: 'O e-mail do portal está funcionando',
    paragraphs: ['Se você recebeu esta mensagem, os avisos automáticos do portal estão configurados certinho.'],
    button: { label: 'Abrir o portal', url: `${BASE()}/estudio` },
  });
}
