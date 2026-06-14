import { redirect } from 'next/navigation';
import { apiUrl } from '@lib/api-url';

export default function HomePage() {
  redirect(apiUrl('/dashboard'));
}
