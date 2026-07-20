import { redirect } from 'next/navigation';
import { isAuthenticated, isDefaultPassword } from '@/lib/auth';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Sign in' };

export default async function LoginPage() {
  if (await isAuthenticated()) redirect('/admin');
  return <LoginForm showDefaultNote={isDefaultPassword()} />;
}
