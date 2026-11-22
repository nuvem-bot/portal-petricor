import Logo from '../Logo';

export const metadata = { title: 'Acesso pausado · Portal Petricor' };

export default function AcessoPausado() {
  return (
    <div className="login">
      <div className="panel">
        <div className="brand" style={{ marginBottom: 24 }}><Logo height={48} /></div>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>Este link está pausado</h1>
        <p className="muted small">O acesso a este projeto foi pausado pelo estúdio. Se você acha que é um engano, fale com a Petricor.</p>
      </div>
    </div>
  );
}
