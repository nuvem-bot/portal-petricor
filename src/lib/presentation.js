// Dados da apresentação que a designer preenche no painel.
export const EMPTY_PRESENTATION = {
  title: '',
  concept: '',
  pillars: [{ t: '', d: '' }, { t: '', d: '' }, { t: '', d: '' }],
  palette: [
    { name: '', hex: '#1E3FA8', note: '' },
    { name: '', hex: '#E8DCC4', note: '' },
    { name: '', hex: '#A8C3B0', note: '' },
    { name: '', hex: '#2A2A2A', note: '' },
  ],
  displayFont: 'Fraunces',
  bodyFont: 'Inter',
  typeNote: '',
  closing: 'Essa é a sua marca. Ela é sua?',
};

export function parsePresentation(raw) {
  try {
    const p = raw ? JSON.parse(raw) : {};
    return { ...EMPTY_PRESENTATION, ...p };
  } catch {
    return { ...EMPTY_PRESENTATION };
  }
}

export const isHex = (v) => /^#[0-9a-fA-F]{6}$/.test(v || '');
// Nome de fonte do Google Fonts: só letras, números e espaços
export const safeFont = (v, d) => (/^[A-Za-z0-9 ]{2,40}$/.test(v || '') ? v : d);
