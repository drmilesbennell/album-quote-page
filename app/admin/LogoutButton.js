'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }
  return (
    <button className="icon-btn" onClick={logout} style={{ fontSize: 13 }}>
      Sign out
    </button>
  );
}
