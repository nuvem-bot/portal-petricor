import { cleanName } from '@/lib/names';
import { loadClientProject } from '@/lib/client-project';
import { fileUrl, fmtSize } from '@/lib/url';

export default async function Entrega({ params }) {
  const p = await loadClientProject(params.token);
  const files = p.stage === 'entrega' ? p.assets.filter((a) => a.kind === 'entrega') : [];
  return (
    <>
      <div className="vhead">
        <div><span className="label">Etapa 6 · Entrega</span><h1>Sua marca, pronta para usar</h1><p>Os arquivos ficam aqui. Baixe quando quiser e compartilhe com a gráfica ou com quem cuida das suas redes.</p></div>
        <span className={`pill ${p.stage === 'entrega' ? 'ok' : 'wait'}`}>{p.stage === 'entrega' ? 'Disponível' : 'Libera na entrega'}</span>
      </div>
      <div className="panel">
        {files.length ? (
          <ul className="files">
            {files.map((a) => {
              const ext = a.file.split('.').pop();
              return (
                <li key={a.id}>
                  <span className="ext">{ext}</span>
                  <div><b>{cleanName(a.label)}</b><br /><small className="muted">{ext.toUpperCase()} · {fmtSize(a.size)}</small></div>
                  <a className="btn ghost sm" href={fileUrl(a.file, p.token, { download: true, name: cleanName(a.label) })}>Baixar</a>
                </li>
              );
            })}
          </ul>
        ) : <p className="muted">{p.stage === 'entrega' ? 'Os arquivos estão sendo preparados.' : 'Os arquivos finais aparecem aqui depois da aprovação e da finalização.'}</p>}
      </div>
    </>
  );
}
