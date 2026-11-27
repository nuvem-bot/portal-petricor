// Logo oficial da Petricor (arte final 2026). Versão azul no tema claro, branca no escuro.
export default function Logo({ height = 34 }) {
  return (
    <picture>
      <source srcSet="/marca/petricor-branco.png" media="(prefers-color-scheme: dark)" />
      <img src="/marca/petricor-azul.png" alt="Petricor" height={height} style={{ height, width: 'auto' }} />
    </picture>
  );
}
