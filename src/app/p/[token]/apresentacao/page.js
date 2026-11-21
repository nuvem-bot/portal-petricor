import { loadClientProject } from '@/lib/client-project';
import { parsePresentation, safeFont } from '@/lib/presentation';
import { fileUrl, fmtDate } from '@/lib/url';
import Show from './Show';

export default async function Apresentacao({ params }) {
  const p = await loadClientProject(params.token);
  const pres = parsePresentation(p.presentation);
  const df = safeFont(pres.displayFont, 'Fraunces');
  const bf = safeFont(pres.bodyFont, 'Inter');
  const fam = [...new Set([df, bf])].map((f) => `family=${f.replace(/ /g, '+')}:wght@300;400;500;700`).join('&');
  const logo = p.assets.find((a) => a.kind === 'logo');
  const grafismo = p.assets.find((a) => a.kind === 'grafismo');
  const mockups = p.assets.filter((a) => a.kind === 'mockup').map((a) => ({ src: fileUrl(a.file, p.token), label: a.label.replace(/\.[a-z0-9]+$/i, '') }));
  return (
    <>
      <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?${fam}&display=swap`} />
      <Show
        base={`/p/${p.token}`}
        brand={p.brandName}
        client={p.clientName}
        date={fmtDate(p.proposalSentAt || p.updatedAt, { day: '2-digit', month: 'short', year: 'numeric' })}
        pres={pres}
        display={df}
        body={bf}
        logo={logo ? fileUrl(logo.file, p.token) : null}
        pattern={grafismo ? fileUrl(grafismo.file, p.token) : null}
        mockups={mockups}
        canDecide={p.stage === 'proposta' && !p.decision}
      />
    </>
  );
}
