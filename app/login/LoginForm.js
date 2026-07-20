'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm({ showDefaultNote }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push('/admin');
      router.refresh();
    } else {
      setError('Incorrect password');
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <p className="eyebrow">Anthony Niccoli Photography</p>
        <h1 className="admin-title" style={{ marginBottom: 20 }}>
          Quote Builder
        </h1>
        {showDefaultNote ? (
          <div className="inline-note">
            No ADMIN_PASSWORD is set, so the password is <strong>changeme</strong>. Set the
            ADMIN_PASSWORD environment variable before sharing links.
          </div>
        ) : null}
        <form onSubmit={submit}>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
            />
          </div>
          {error ? <p className="error-text">{error}</p> : null}
          <button className="btn" disabled={busy || !password}>
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
