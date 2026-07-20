'use client';

import { useState } from 'react';

export default function SettingsForm({ initialSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [state, setState] = useState('');

  function set(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function save(event) {
    event.preventDefault();
    setState('Saving…');
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settings, taxRate: Number(settings.taxRate) || 0 }),
    });
    setState(res.ok ? 'Saved' : 'Save failed');
  }

  return (
    <>
      <div className="admin-title-row">
        <h1 className="admin-title">Settings</h1>
        <span className={`save-state ${state === 'Saving…' ? 'saving' : ''}`}>{state}</span>
      </div>
      <form className="panel" onSubmit={save} style={{ maxWidth: 640 }}>
        <div className="field">
          <label>Business name</label>
          <input
            type="text"
            value={settings.businessName}
            onChange={(event) => set('businessName', event.target.value)}
          />
        </div>
        <div className="field">
          <label>Default sales tax %</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={settings.taxRate}
            onChange={(event) => set('taxRate', event.target.value)}
          />
          <p className="hint">
            Applied to new quotes. Each quote can override its own rate in the editor.
          </p>
        </div>
        <div className="field">
          <label>Intro text</label>
          <textarea
            value={settings.introText}
            onChange={(event) => set('introText', event.target.value)}
          />
          <p className="hint">Optional. Shown under the quote title on the client page.</p>
        </div>
        <div className="field">
          <label>Acceptance text</label>
          <textarea
            value={settings.acceptanceText}
            onChange={(event) => set('acceptanceText', event.target.value)}
          />
          <p className="hint">Shown above the signature box on the client page.</p>
        </div>
        <div className="field">
          <label>Zapier webhook URL</label>
          <input
            type="text"
            value={settings.webhookUrl || ''}
            placeholder="https://hooks.zapier.com/hooks/catch/…"
            onChange={(event) => set('webhookUrl', event.target.value)}
          />
          <p className="hint">
            Optional. When a client accepts a quote, its details (client, chosen items,
            totals, signature) are sent here as JSON. Paste a Zapier Catch Hook URL to
            feed a zap, e.g. creating the client and invoice in Pixifi.
          </p>
        </div>
        <button className="btn">Save settings</button>
      </form>
    </>
  );
}
