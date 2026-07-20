import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { missingDatabaseUrl } from '@/lib/db';
import SetupNotice from '@/components/SetupNotice';
import LogoutButton from './LogoutButton';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  if (!(await isAuthenticated())) redirect('/login');
  if (missingDatabaseUrl()) return <SetupNotice />;
  return (
    <>
      <nav className="admin-nav no-print">
        <div className="admin-nav-inner">
          <Link href="/admin" className="brand">
            ANP Quotes
          </Link>
          <Link href="/admin">Quotes</Link>
          <Link href="/admin/catalog">Collections &amp; Add-ons</Link>
          <Link href="/admin/settings">Settings</Link>
          <span className="spacer" />
          <LogoutButton />
        </div>
      </nav>
      <div className="admin-shell">{children}</div>
    </>
  );
}
