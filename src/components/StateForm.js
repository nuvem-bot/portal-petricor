'use client';
import { useFormState } from 'react-dom';

// Formulário com mensagem de erro/sucesso vinda da server action
export default function StateForm({ action, children, className = 'form', ...rest }) {
  const [state, formAction] = useFormState(action, null);
  return (
    <form action={formAction} className={className} {...rest}>
      {children}
      {state?.error && <p className="msg-err" role="alert">{state.error}</p>}
      {typeof state?.ok === 'string' && state.ok.length > 12 && <p className="msg-ok" role="status">{state.ok}</p>}
    </form>
  );
}
