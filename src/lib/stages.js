// As etapas do processo de identidade visual da Petricor, na ordem.
export const STAGES = [
  { id: 'briefing', name: 'Briefing', client: 'Você conta sobre a marca', studio: 'Aguardando respostas do cliente' },
  { id: 'moodboard', name: 'Moodboard', client: 'Você diz o que gostou e não gostou em cada referência', studio: 'Montar moodboard e receber feedback' },
  { id: 'criacao', name: 'Criação', client: 'A designer está desenhando', studio: 'Desenhar a identidade' },
  { id: 'proposta', name: 'Proposta', client: 'Você vê a apresentação e aprova', studio: 'Proposta com o cliente' },
  { id: 'finalizacao', name: 'Finalização', client: 'Manual e arquivos finais', studio: 'Fechar manual e exportar arquivos' },
  { id: 'entrega', name: 'Entrega', client: 'Tudo pronto para usar', studio: 'Arquivos liberados' },
];

export const stageIndex = (id) => Math.max(0, STAGES.findIndex((s) => s.id === id));
export const stageName = (id) => STAGES[stageIndex(id)].name;

// Quem precisa agir agora em cada etapa
export function whoActs(p) {
  switch (p.stage) {
    case 'briefing': return p.briefingAt ? 'estudio' : 'cliente';
    case 'moodboard': return p.moodSentAt ? 'estudio' : 'cliente';
    case 'criacao': return 'estudio';
    case 'proposta': return !p.publishedAt || p.decision === 'ajustes' ? 'estudio' : 'cliente';
    case 'finalizacao': return 'estudio';
    default: return 'ninguem';
  }
}
