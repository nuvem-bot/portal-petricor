'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ClientNav({ items }) {
  const path = usePathname();
  return (
    <nav className="steps" aria-label="Etapas do projeto">
      <ol>
        {items.map((it, i) => (
          <li key={it.href}>
            <Link href={it.href} className={it.state ? `is-${it.state}` : ''} aria-current={path === it.href ? 'page' : undefined}>
              <span className="dot">{it.idx < 0 ? '◎' : it.state === 'done' ? '✓' : i}</span>{it.name}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
