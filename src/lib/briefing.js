// Perguntas do briefing de identidade visual (as mesmas do formulário que a Petricor usava no Respondi).
// Para mudar o briefing, edite esta lista.
//   type: text | email | textarea | radio (uma opção) | chips (várias, até `max`)
//   section: abre um novo bloco no formulário
export const WORDS = [
  'Sofisticada', 'Elegante', 'Autoridade', 'Acolhedora', 'Confiável', 'Moderna', 'Clássica', 'Minimalista',
  'Feminina', 'Natural', 'Artesanal', 'Jovem', 'Divertida', 'Criativa', 'Ousada', 'Tecnológica', 'Inovadora', 'Sustentável',
];

export const QUESTIONS = [
  { section: 'Sobre você', id: 'nome', label: 'Seu nome completo', type: 'text', required: true },
  { id: 'email', label: 'E-mail', type: 'email', required: true },
  { id: 'cargo', label: 'Cargo ou função na empresa', type: 'radio', options: ['CEO/Fundador(a)', 'Sócio(a)', 'Marketing', 'Gerente', 'Outro'] },

  { section: 'Sobre a marca', id: 'representa', label: 'A marca representa', type: 'radio', options: ['Uma empresa', 'Uma marca pessoal', 'Um produto ou serviço', 'Outro'] },
  { id: 'marca', label: 'Nome da sua empresa ou marca', type: 'text', required: true },
  { id: 'instagram', label: 'Instagram da empresa ou marca', hint: 'Com @', type: 'text' },
  { id: 'oque', label: 'Em poucas linhas, o que essa marca é e o que ela entrega?', hint: 'Quais produtos ou serviços são oferecidos?', type: 'textarea', required: true },
  { id: 'porque', label: 'Por que essa marca existe? O que motivou sua criação?', type: 'textarea' },
  { id: 'mvv', label: 'Quais são a missão, a visão e os valores da sua empresa?', hint: 'Se ainda não tiver definido, pode dizer.', type: 'textarea' },
  { id: 'diferencial', label: 'O que torna essa marca diferente de outras semelhantes?', type: 'textarea' },
  { id: 'concorrentes', label: 'Sua empresa tem concorrentes? Quem são?', hint: 'Fale um pouco sobre eles se achar necessário. Coloque nomes e links se puder.', type: 'textarea' },
  { id: 'fase', label: 'Em que fase essa marca está hoje?', type: 'radio', options: ['Ainda não lançada', 'Recém-lançada', 'Crescimento', 'Reposicionamento', 'Consolidada'] },

  { section: 'Público e percepção', id: 'publico', label: 'Para quem essa marca fala hoje?', hint: 'Descreva com suas palavras.', type: 'textarea', required: true },
  { id: 'percepcao', label: 'Como você gostaria que esse público percebesse e descrevesse a sua marca?', type: 'textarea' },

  { section: 'Referências', id: 'admira', label: 'Existem marcas ou referências visuais que você admira? Por quê?', hint: 'Pode colar links do Instagram, Pinterest ou sites.', type: 'textarea' },
  { id: 'naogosta', label: 'Existem marcas, estilos ou abordagens que você NÃO gosta ou com que não quer se parecer?', type: 'textarea' },
  { id: 'palavras', label: 'Escolha até 5 palavras que representam essa marca', type: 'chips', options: WORDS, max: 5 },
  { id: 'naopalavras', label: 'Agora até 3 palavras que NÃO combinam com essa marca', type: 'chips', options: WORDS, max: 3 },
  { id: 'querver', label: 'Existe alguma cor, ícone ou frase que você gostaria de ver na identidade?', type: 'textarea' },
  { id: 'slogan', label: 'Existe algum slogan para sua marca? Se sim, qual?', type: 'textarea' },
  { id: 'evitar', label: 'Existe alguma cor, símbolo ou elemento que você não quer de forma alguma?', type: 'textarea' },

  { section: 'Onde a marca vai aparecer', id: 'onde', label: 'Onde essa identidade será mais aplicada?', type: 'chips', options: ['Redes sociais', 'Site', 'Materiais digitais', 'Materiais impressos', 'Embalagens', 'Fachada e sinalização', 'Uniformes', 'Outro'], max: 8 },
  { id: 'papelaria', label: 'Quais itens de papelaria deseja criar?', hint: 'Podemos rever esses itens de acordo com a necessidade da marca.', type: 'chips', options: ['Cartão de visita', 'Papel timbrado', 'Assinatura de e-mail', 'Template para proposta/orçamento', 'Template para apresentação', 'Envelope', 'Pasta', 'Outro'], max: 8 },
  { id: 'papelariaobs', label: 'Quer comentar algo sobre esses itens?', type: 'textarea' },
];

export function parseBriefing(raw) {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
