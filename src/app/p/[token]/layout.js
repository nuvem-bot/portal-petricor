import Link from 'next/link';
import { loadClientProject } from '@/lib/client-project';
import { stageIndex } from '@/lib/stages';
import Logo from '../../Logo';
import ClientNav from './ClientNav';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const p = await loadClientProject(params.token);
  return { title: `${p.brandName} · Portal Petricor` };
}

export default async function ClientLayout({ children, params }) {
  const p = await loadClientProject(params.token);
  const cur = stageIndex(p.stage);
  const base = `/p/${p.token}`;
  const items = [
    { href: base, name: 'Visão geral', idx: -1 },
    { href: `${base}/briefing`, name: 'Briefing', idx: 0 },
    { href: `${base}/moodboard`, name: 'Moodboard', idx: 1 },
    { href: `${base}/proposta`, name: 'Proposta', idx: 3 },
    { href: `${base}/entrega`, name: 'Entrega', idx: 5 },
  ].map((i) => ({ ...i, state: i.idx < 0 ? '' : i.idx < cur ? 'done' : i.idx === cur || (i.idx === 3 && cur === 2) ? 'now' : '' }));
  return (
    <>
      <header className="top">
        <div className="wrap">
          <div className="bar">
            <Link href={base} className="brand"><Logo /></Link>
            <div className="who"><span>Projeto</span><b>{p.brandName}</b></div>
          </div>
          <ClientNav items={items} />
        </div>
      </header>
      <main className="wrap">{children}</main>
      <footer className="proto">Petricor Estúdio · Amparo/SP</footer>
    </>
  );
}
