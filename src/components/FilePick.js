'use client';
import { useState } from 'react';
import Icon from './Icon';

// Botão quadrado com ícone para escolher arquivo. Mostra o nome do que foi escolhido.
// autoSubmit: envia o formulário assim que os arquivos são escolhidos.
export default function FilePick({ name, accept, multiple, required, form, label, autoSubmit, id }) {
  const [names, setNames] = useState([]);
  const [sending, setSending] = useState(false);
  const change = (e) => {
    const files = [...(e.target.files || [])];
    setNames(files.map((f) => f.name.normalize('NFC')));
    if (autoSubmit && files.length) {
      const f = e.target.form;
      if (f) { setSending(true); f.requestSubmit(); }
    }
  };
  const text = sending ? 'Enviando…' : names.length > 1 ? `${names.length} arquivos escolhidos` : names[0] || label;
  return (
    <label className={`filepick ${names.length ? 'has' : ''}`} title={label}>
      <span className="iconbtn"><Icon name="upload" size={18} /></span>
      <input type="file" id={id} name={name} accept={accept} multiple={multiple} required={required} form={form} aria-label={label} onChange={change} />
      <span className="fp-text">{text}</span>
    </label>
  );
}
