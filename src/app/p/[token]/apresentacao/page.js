import Link from 'next/link';
import { loadClientProject } from '@/lib/client-project';
import { currentDesigner } from '@/lib/auth';
import { draftSnapshot, versionSnapshot, safeFont } from '@/lib/presentation';
import { fileUrl, fmtDate } from '@/lib/url';
import Show from './Show';

export default async function Apresentacao({ params, searchParams }) {
  const p = await loadClientProject(params.token);
  // A designer logada pode ver o rascunho com ?rascunho=1. O cliente sempre vê a versão liberada.
  const draft = searchParams?.rascunho === '1' && (await currentDesigner());
  // ?v=N abre uma versão anterior; sem v, a mais recente
  const latest = p.versions[0];
  const version = searchParams?.v ? p.versions.find((v) => String(v.number) === searchParams.v) || latest : latest;
  const snap = draft ? draftSnapshot(p) : versionSnapshot(version);
  if (!snap) {
    return (
      <div className="vhead"><div><span className="label">Proposta</span><h1>A apresentação ainda não foi liberada</h1><p>Quando a designer liberar, ela aparece aqui.</p><p style={{ marginTop: 16 }}><Link className="btn" href={`/p/${p.token}`}>Voltar ao projeto</Link></p></div></div>
    );
  }
  const { pres } = snap;
  const df = safeFont(pres.displayFont, 'Fraunces');
  const bf = safeFont(pres.bodyFont, 'Inter');
  const fam = [...new Set([df, bf])].map((f) => `family=${f.replace(/ /g, '+')}:wght@300;400;500;700`).join('&');
  const url = (f) => (f ? fileUrl(f, p.token) : null);
  return (
    <>
      <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?${fam}&display=swap`} />
      {draft && <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: '#B26A00', color: '#fff', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600 }}>Rascunho · o cliente não vê esta versão</div>}
      <Show
        base={`/p/${p.token}`}
        brand={p.brandName}
        client={p.clientName}
        date={`${draft ? 'Rascunho' : `Versão ${version.number}`} · ${fmtDate(draft ? new Date() : version.publishedAt, { day: '2-digit', month: 'short', year: 'numeric' })}`}
        pres={{ ...pres, build: (pres.build || []).map((b) => ({ ...b, src: url(b.img) })) }}
        display={df}
        body={bf}
        logo={url(snap.logo)}
        pattern={url(snap.pattern)}
        mockups={snap.mockups.map((m) => ({ src: url(m.file), label: m.label }))}
        canDecide={!draft && version.id === latest.id && p.stage === 'proposta' && !p.decision}
      />
    </>
  );
}
