// Nomes de arquivo vindos do Mac chegam em NFD e, às vezes, com os bytes
// UTF-8 lidos como Latin-1 ("CriaÌ§aÌƒo"). Conserta e tira a extensão.
export function cleanName(name) {
  let s = String(name || '');
  if (/[ÃÂÌÅ][\u0080-ÿ]/.test(s)) {
    const bytes = Uint8Array.from([...s].map((ch) => ch.charCodeAt(0) & 0xff));
    try {
      const fixed = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      if ([...s].every((ch) => ch.charCodeAt(0) < 256)) s = fixed;
    } catch {}
  }
  return s.normalize('NFC');
}

export function labelFromFile(name) {
  return cleanName(name).replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[_]+/g, ' ').trim() || 'Arquivo';
}
