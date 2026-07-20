'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { computeTotals, formatMoney, lineTotalCents } from '@/lib/totals';
import { QuoteTotals } from '@/components/QuoteItemsView';

const POLL_MS = 4000;

// The single quote page. Signed in as admin, the checkboxes and quantities
// are live - share this screen on a call and click away; every change
// autosaves. Anyone else with the link sees the same page read-only (polling
// so it follows along) and can sign at the bottom.
export default function QuoteView({ initialQuote, initialSettings, admin }) {
  const [quote, setQuote] = useState(initialQuote);
  const [settings, setSettings] = useState(initialSettings);
  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState('');
  const [copied, setCopied] = useState(false);
  const saveTimer = useRef(null);
  const quoteRef = useRef(quote);
  quoteRef.current = quote;

  const accepted = quote.status === 'accepted';
  const editable = admin && !accepted;

  // Viewers poll so the page follows the photographer's live changes. The
  // admin does not poll - their own edits are the source of truth.
  useEffect(() => {
    if (admin || accepted) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/q/${quote.slug}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setQuote(data.quote);
        setSettings(data.settings);
      } catch {
        // Offline blip - keep showing the last known quote.
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [quote.slug, accepted, admin]);

  const persist = useCallback(async () => {
    const current = quoteRef.current;
    setSaveState('Saving…');
    const res = await fetch(`/api/quotes/${current.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: current.clientName,
        clientEmail: current.clientEmail,
        title: current.title,
        taxRate: Number(current.taxRate) || 0,
        status: current.status,
        items: current.items,
      }),
    });
    setSaveState(res.ok ? 'Saved' : 'Save failed');
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('Editing…');
    saveTimer.current = setTimeout(persist, 600);
  }, [persist]);

  useEffect(() => () => saveTimer.current && clearTimeout(saveTimer.current), []);

  function update(patch) {
    setQuote((prev) => ({ ...prev, ...patch }));
    scheduleSave();
  }

  function updateItem(key, patch) {
    setQuote((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    }));
    scheduleSave();
  }

  async function copyLink() {
    const url = `${window.location.origin}/q/${quote.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link', url);
    }
  }

  async function accept(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/q/${quote.slug}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureName: signature }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      }
      const refreshed = await fetch(`/api/q/${quote.slug}`, { cache: 'no-store' });
      if (refreshed.ok) {
        const payload = await refreshed.json();
        setQuote((prev) => ({ ...prev, ...payload.quote }));
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const totals = computeTotals(quote.items, quote.taxRate);

  return (
    <div className="quote-shell">
      {admin ? (
        <div className="panel no-print admin-toolbar">
          <Link href="/admin" className="muted" style={{ whiteSpace: 'nowrap' }}>
            ← All quotes
          </Link>
          <div className="field" style={{ margin: 0, flex: 1, minWidth: 160 }}>
            <label>Client name</label>
            <input
              type="text"
              value={quote.clientName}
              disabled={accepted}
              onChange={(event) => update({ clientName: event.target.value })}
            />
          </div>
          <div className="field" style={{ margin: 0, width: 90 }}>
            <label>Tax %</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={quote.taxRate}
              disabled={accepted}
              onChange={(event) => update({ taxRate: event.target.value })}
            />
          </div>
          <button className="btn ghost small" onClick={copyLink}>
            {copied ? 'Copied' : 'Copy client link'}
          </button>
          <span className={`save-state ${saveState === 'Saving…' ? 'saving' : ''}`}>
            {accepted ? 'Locked' : saveState}
          </span>
        </div>
      ) : null}

      <div className="quote-card">
        <div className="quote-head">
          <div>
            {settings.businessName ? (
              <p className="eyebrow">{settings.businessName}</p>
            ) : null}
            <h1 className="quote-title">{quote.title || 'Quote'}</h1>
            {quote.clientName ? (
              <p className="quote-client">Prepared for {quote.clientName}</p>
            ) : null}
          </div>
          <button className="btn no-print" onClick={() => window.print()}>
            Print
          </button>
        </div>

        {settings.introText ? <p className="quote-intro">{settings.introText}</p> : null}

        <div className="item-table">
          {quote.items.map((item) => (
            <div className="item-row" key={item.key}>
              <div className="item-check">
                <input
                  type="checkbox"
                  checked={!!item.selected}
                  disabled={!editable}
                  readOnly={!editable}
                  onChange={
                    editable
                      ? (event) => updateItem(item.key, { selected: event.target.checked })
                      : undefined
                  }
                />
              </div>
              <div className="item-main">
                <p className="item-name">{item.name}</p>
                {item.description ? <p className="item-desc">{item.description}</p> : null}
                {item.footnote ? <p className="item-footnote">{item.footnote}</p> : null}
              </div>
              {item.kind === 'addon' && editable ? (
                <input
                  className="item-qty"
                  type="number"
                  min="0"
                  value={item.qty}
                  onChange={(event) => {
                    const qty = Math.max(0, Number(event.target.value) || 0);
                    updateItem(item.key, { qty, selected: qty > 0 });
                  }}
                />
              ) : item.kind === 'addon' ? (
                <input className="item-qty" value={item.qty} readOnly tabIndex={-1} />
              ) : (
                <div className="item-qty static">{item.qty}</div>
              )}
              <div className="item-unit">{formatMoney(item.unitPriceCents)}</div>
              <div className="item-total">{formatMoney(lineTotalCents(item))}</div>
            </div>
          ))}
        </div>

        <QuoteTotals totals={totals} />

        {accepted ? (
          <div className="accepted-banner">
            Accepted by <strong>{quote.signatureName}</strong> on{' '}
            {new Date(quote.acceptedAt).toLocaleString('en-US', {
              dateStyle: 'long',
              timeStyle: 'short',
            })}
            .
          </div>
        ) : (
          <div className="accept-section no-print">
            <p className="accept-text">
              {settings.acceptanceText ||
                'To indicate your acceptance of the above, sign electronically below.'}
            </p>
            <form className="accept-row" onSubmit={accept}>
              <input
                className="accept-input"
                placeholder="Type your name"
                value={signature}
                onChange={(event) => setSignature(event.target.value)}
              />
              <button className="btn" disabled={submitting || !signature.trim()}>
                {submitting ? 'Submitting…' : 'Accept Quote'}
              </button>
              {error ? <span className="error-text">{error}</span> : null}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
