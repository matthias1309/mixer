import type { Metadata } from 'next';
import { LoginForm } from '../../components/forms/LoginForm';

export const metadata: Metadata = {
  title: 'Login | Recipe Manager',
  description: 'Log in to your Recipe Manager account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <LoginForm />
    </div>
  );
}
