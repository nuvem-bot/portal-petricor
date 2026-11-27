// Dados da apresentação que a designer preenche no painel.
export const EMPTY_PRESENTATION = {
  title: '',
  concept: '',
  // Antigo (versões liberadas antes da "construção da marca")
  pillars: [],
  // Construção da marca: etapas com imagem, título e texto (ex.: o eixo, as letras, a estrela…)
  buildTitle: 'Construção da marca',
  build: [],
  palette: [
    { name: '', hex: '#1E3FA8', note: '' },
    { name: '', hex: '#E8DCC4', note: '' },
    { name: '', hex: '#A8C3B0', note: '' },
    { name: '', hex: '#2A2A2A', note: '' },
  ],
  // Até 3 fontes: papel (Títulos, Acento, Textos), família do Google Fonts, peso, observação e frase de exemplo
  fonts: [
    { role: 'Títulos', family: 'Fraunces', weight: '400', note: '', sample: '' },
    { role: 'Textos', family: 'Inter', weight: '400', note: '', sample: '' },
  ],
  // Derivadas de fonts (a primeira para títulos, a última para textos)
  displayFont: 'Fraunces',
  bodyFont: 'Inter',
  // Logo na malha de construção (imagem) e versões finais do logo sobre fundos da paleta
  gridImg: null,
  logoVersions: [],
  typeNote: '',
  closing: 'Essa é a sua marca. Ela é sua?',
  // Fundo da capa: liso | grafismo (imagem da marca) | ondas | grade | grao
  cover: 'liso',
};

export function parsePresentation(raw) {
  try {
    const p = raw ? JSON.parse(raw) : {};
    return normalize({ ...EMPTY_PRESENTATION, ...p });
  } catch {
    return { ...EMPTY_PRESENTATION };
  }
}

export const COVERS = [
  { id: 'liso', name: 'Liso, só a cor principal' },
  { id: 'grafismo', name: 'Grafismo da marca (imagem enviada)' },
  { id: 'grao', name: 'Textura de grão' },
  { id: 'grade', name: 'Grade sutil' },
  { id: 'ondas', name: 'Linhas em movimento' },
];

export const isHex = (v) => /^#[0-9a-fA-F]{6}$/.test(v || '');
// Nome de fonte do Google Fonts: só letras, números e espaços
export const safeFont = (v, d) => (/^[A-Za-z0-9 ]{2,40}$/.test(v || '') ? v : d);

// Monta a apresentação a partir do rascunho e dos arquivos atuais do projeto.
export function draftSnapshot(p) {
  const assets = p.assets || [];
  const logo = assets.find((a) => a.kind === 'logo');
  const pattern = assets.find((a) => a.kind === 'grafismo');
  return {
    pres: parsePresentation(p.presentation),
    logo: logo?.file || null,
    pattern: pattern?.file || null,
    mockups: assets.filter((a) => a.kind === 'mockup').map((a) => ({ file: a.file, label: a.label.replace(/\.[a-z0-9]+$/i, '') })),
  };
}

// Lê a foto de uma versão liberada.
export function versionSnapshot(v) {
  if (!v) return null;
  try {
    const s = JSON.parse(v.snapshot);
    return { ...s, pres: normalize({ ...EMPTY_PRESENTATION, ...s.pres }) };
  } catch {
    return null;
  }
}

export const BUILD_SLOTS = 6;

export const MAX_COLORS = 8;
export const MAX_FONTS = 3;
export const LOGO_VERSIONS = 3;
export const WEIGHTS = ['300', '400', '500', '700'];

// Apresentações antigas não tinham a lista de fontes: monta a partir de displayFont/bodyFont
function normalize(p) {
  if (!p.fonts?.length || p.fonts === EMPTY_PRESENTATION.fonts) {
    p.fonts = [
      { role: 'Títulos', family: p.displayFont || 'Fraunces', weight: '400', note: '', sample: '' },
      { role: 'Textos', family: p.bodyFont || 'Inter', weight: '400', note: '', sample: '' },
    ];
  }
  while (p.palette.length < 4) p.palette.push(EMPTY_PRESENTATION.palette[p.palette.length]);
  return p;
}

// Endereços de Google Fonts: um link simples (sempre funciona) e um com pesos (para fontes que têm vários)
export function fontLinks(fonts) {
  const fams = [...new Set(fonts.map((f) => safeFont(f.family, '')).filter(Boolean))];
  return fams.flatMap((f) => {
    const q = f.replace(/ /g, '+');
    return [`https://fonts.googleapis.com/css2?family=${q}&display=swap`, `https://fonts.googleapis.com/css2?family=${q}:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400&display=swap`];
  });
}
