import Link from 'next/link';
import { requireDesigner } from '@/lib/auth';
import { logout } from '@/lib/actions-studio';
import Logo from '../Logo';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Estúdio · Portal Petricor' };

export default async function StudioLayout({ children }) {
  const me = await requireDesigner();
  return (
    <>
      <header className="top">
        <div className="wrap bar">
          <Link href="/estudio" className="brand"><Logo /> <span className="label" style={{ marginLeft: 4 }}>estúdio</span></Link>
          <div className="who">{me.role === 'adm' && <Link href="/estudio/configuracoes" className="linkbtn">Configurações</Link>}<b>{me.name}</b><form action={logout}><button className="linkbtn" type="submit">Sair</button></form></div>
        </div>
      </header>
      <main className="wrap">{children}</main>
    </>
  );
}
