import { redirect } from 'next/navigation';
import { currentDesigner } from '@/lib/auth';
import { login } from '@/lib/actions-studio';
import StateForm from '@/components/StateForm';
import Submit from '@/components/Submit';
import Logo from '../Logo';

export const metadata = { title: 'Entrar · Portal Petricor' };

export default async function Login() {
  if (await currentDesigner()) redirect('/estudio');
  return (
    <div className="login">
      <div className="panel">
        <div className="brand" style={{ marginBottom: 24 }}><Logo height={48} /></div>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>Painel do estúdio</h1>
        <p className="muted small" style={{ marginBottom: 20 }}>Acesso da equipe. Clientes entram pelo link do próprio projeto.</p>
        <StateForm action={login}>
          <div className="field"><label htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="username" required /></div>
          <div className="field"><label htmlFor="senha">Senha</label><input id="senha" name="senha" type="password" autoComplete="current-password" required /></div>
          <Submit pendingText="Entrando…">Entrar</Submit>
        </StateForm>
      </div>
    </div>
  );
}
