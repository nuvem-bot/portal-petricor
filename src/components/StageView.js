'use client';
import { Children, useEffect, useState } from 'react';
import { setStage } from '@/lib/actions-studio';

// Etapas do projeto como abas: clicar numa etapa mostra só o que é dela.
// Mudar a etapa do projeto (o que o cliente vê) é um botão à parte.
// stages: [{ id, name, group }]; children: um painel por grupo, na ordem de `groups`.
export default function StageView({ projectId, current, stages, groups, children }) {
  const key = `etapa-${projectId}`;
  const [view, setView] = useState(current);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
      // Se a etapa do projeto mudou desde a última visita, volta para a atual.
      if (saved && saved.current === current && stages.some((s) => s.id === saved.view)) setView(saved.view);
      else setView(current);
    } catch { setView(current); }
  }, [key, current, stages]);
  const pick = (id) => { setView(id); try { sessionStorage.setItem(key, JSON.stringify({ view: id, current })); } catch {} };

  const curIdx = stages.findIndex((s) => s.id === current);
  const viewStage = stages.find((s) => s.id === view) || stages[curIdx];
  const panels = Children.toArray(children);

  return (
    <>
      <section className="panel">
        <span className="label">Etapas do projeto</span>
        <div className="stage-tabs" role="tablist">
          {stages.map((s, i) => (
            <button key={s.id} type="button" role="tab" aria-selected={s.id === viewStage.id}
              className={`btn sm ${s.id === viewStage.id ? 'primary' : 'ghost'} ${s.id === current ? 'is-current' : ''}`} onClick={() => pick(s.id)}>
              {i < curIdx ? '✓ ' : ''}{s.name}{s.id === current ? <span className="cur-dot" aria-label="etapa atual" /> : null}
            </button>
          ))}
        </div>
        <div className="stage-bar">
          {viewStage.id === current ? (
            <p className="muted small"><span className="cur-dot" /> Etapa atual do projeto. É o que o cliente vê no portal.</p>
          ) : (
            <form action={setStage} className="row" style={{ gap: 10 }}>
              <input type="hidden" name="id" value={projectId} /><input type="hidden" name="stage" value={viewStage.id} />
              <p className="muted small" style={{ margin: 0 }}>Você está vendo {viewStage.name}. A etapa atual é {stages[curIdx].name}.</p>
              <button type="submit" className="btn sm">Mover o projeto para {viewStage.name}</button>
            </form>
          )}
        </div>
      </section>
      {panels.map((p, i) => (
        <div key={groups[i]} hidden={viewStage.group !== groups[i]} className="stack">{p}</div>
      ))}
    </>
  );
}
