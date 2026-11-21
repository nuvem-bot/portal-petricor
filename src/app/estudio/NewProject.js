'use client';
import { useState } from 'react';
import StateForm from '@/components/StateForm';
import Submit from '@/components/Submit';
import { createProject } from '@/lib/actions-studio';

export default function NewProject() {
  const [open, setOpen] = useState(false);
  if (!open) return <button className="btn primary" type="button" onClick={() => setOpen(true)}>Novo projeto</button>;
  return (
    <div className="panel" style={{ width: '100%' }}>
      <span className="label">Novo projeto</span>
      <StateForm action={createProject}>
        <div className="fgrid">
          <div className="field"><label htmlFor="np-brand">Nome da marca</label><input id="np-brand" name="brandName" required /></div>
          <div className="field"><label htmlFor="np-client">Nome do cliente</label><input id="np-client" name="clientName" required /></div>
          <div className="field"><label htmlFor="np-email">E-mail do cliente <span className="hint">opcional</span></label><input id="np-email" name="clientEmail" type="email" /></div>
          <div className="field"><label htmlFor="np-due">Entrega prevista <span className="hint">opcional</span></label><input id="np-due" name="dueDate" type="date" /></div>
        </div>
        <div className="row"><Submit pendingText="Criando…">Criar projeto</Submit><button type="button" className="btn ghost" onClick={() => setOpen(false)}>Cancelar</button></div>
      </StateForm>
    </div>
  );
}
