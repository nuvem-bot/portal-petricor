import { loadClientProject } from '@/lib/client-project';
import { fileUrl, fmtDate } from '@/lib/url';
import MoodBoard from './MoodBoard';

export default async function Moodboard({ params }) {
  const p = await loadClientProject(params.token);
  const items = p.moodItems.map((m) => ({ id: m.id, src: fileUrl(m.file, p.token), caption: m.caption, liked: m.liked || '', disliked: m.disliked || '' }));
  return (
    <>
      <div className="vhead">
        <div><span className="label">Etapa 2 · Moodboard</span><h1>O que conversa com a sua marca?</h1><p>Em cada imagem, escreva o que você gostou e o que não gostou. Pode ser bem curto, como “gostei da cor e da fonte, não gostei da textura”.</p></div>
        {p.moodSentAt && <span className="pill ok">Enviado em {fmtDate(p.moodSentAt)}</span>}
      </div>
      {items.length ? <MoodBoard token={p.token} items={items} locked={!!p.moodSentAt} />
        : <div className="panel"><p className="muted">O moodboard ainda está sendo montado. Você recebe um aviso quando ele estiver pronto.</p></div>}
    </>
  );
}
