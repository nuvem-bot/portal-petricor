import { loadClientProject } from '@/lib/client-project';
import { fileUrl, fmtDate } from '@/lib/url';
import MoodBoard from './MoodBoard';

export default async function Moodboard({ params }) {
  const p = await loadClientProject(params.token);
  const items = p.moodItems.map((m) => ({ id: m.id, src: fileUrl(m.file, p.token), caption: m.caption, reaction: m.reaction, comment: m.comment }));
  return (
    <>
      <div className="vhead">
        <div><span className="label">Etapa 2 · Moodboard</span><h1>O que conversa com a sua marca?</h1><p>Marque o que gostou e o que não gostou em cada imagem. Um comentário curto ajuda a designer a entender o porquê.</p></div>
        {p.moodSentAt && <span className="pill ok">Enviado em {fmtDate(p.moodSentAt)}</span>}
      </div>
      {items.length ? <MoodBoard token={p.token} items={items} locked={!!p.moodSentAt} />
        : <div className="panel"><p className="muted">O moodboard ainda está sendo montado. Você recebe um aviso quando ele estiver pronto.</p></div>}
    </>
  );
}
