import type { Metadata } from 'next';
import { RegisterForm } from '../../components/forms/RegisterForm';

export const metadata: Metadata = {
  title: 'Register | Recipe Manager',
  description: 'Create a new Recipe Manager account',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <RegisterForm />
    </div>
  );
}
