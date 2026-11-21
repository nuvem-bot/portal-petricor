import 'server-only';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { db } from './db';

// Carrega o projeto da cliente pelo token do link, com tudo que o portal precisa.
export const loadClientProject = cache(async (token) => {
  if (!token || token.length < 16) notFound();
  const p = await db.project.findUnique({
    where: { token },
    include: {
      moodItems: { orderBy: { position: 'asc' } },
      assets: { orderBy: { position: 'asc' } },
      designer: { select: { name: true } },
    },
  });
  if (!p) notFound();
  return p;
});
