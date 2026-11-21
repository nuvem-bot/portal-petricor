// Perguntas do briefing. Para mudar o briefing, edite esta lista.
export const FEELINGS = ['Calma', 'Artesanal', 'Sofisticada', 'Divertida', 'Minimalista', 'Acolhedora', 'Ousada', 'Natural', 'Tecnológica', 'Clássica'];

export const QUESTIONS = [
  { id: 'marca', label: 'Nome da marca', type: 'text', required: true },
  { id: 'oque', label: 'O que você faz, em uma frase?', type: 'textarea', required: true },
  { id: 'publico', label: 'Para quem?', hint: 'Quem compra, onde mora, o que valoriza.', type: 'textarea', required: true },
  { id: 'sensacoes', label: 'Que sensação a marca deve passar?', hint: 'Escolha até 4.', type: 'chips', options: FEELINGS, max: 4 },
  { id: 'diferencial', label: 'O que te diferencia dos concorrentes?', type: 'textarea' },
  { id: 'admira', label: 'Marcas que você admira (e por quê)', type: 'textarea' },
  { id: 'evitar', label: 'O que você não quer de jeito nenhum?', type: 'textarea' },
  { id: 'onde', label: 'Onde a marca vai aparecer mais?', hint: 'Instagram, embalagem, fachada, site...', type: 'textarea' },
];

export function parseBriefing(raw) {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
