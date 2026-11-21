'use client';
import { useFormStatus } from 'react-dom';

export default function Submit({ children, className = 'btn primary', pendingText = 'Salvando…', ...rest }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending} {...rest}>{pending ? pendingText : children}</button>;
}
