'use client';

import { useEffect, useState } from 'react';
import QuoteItemsView from './QuoteItemsView';

const POLL_MS = 4000;

// The client-facing quote. Polls for updates so that while the photographer
// adjusts selections in the admin during a call, the client sees prices move
// in near real time. Once accepted, the quote locks.
export default function ClientQuote({ initialQuote, initialSettings }) {
  const [quote, setQuote] = useState(initialQuote);
  const [settings, setSettings] = useState(initialSettings);
  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const accepted = quote.status === 'accepted';

  useEffect(() => {
    if (accepted) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/q/${quote.slug}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setQuote(data.quote);
        setSettings(data.settings);
      } catch {
        // Offline blip — keep showing the last known quote.
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [quote.slug, accepted]);

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
        setQuote(payload.quote);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="quote-shell">
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

        <QuoteItemsView items={quote.items} taxRate={quote.taxRate} />

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
