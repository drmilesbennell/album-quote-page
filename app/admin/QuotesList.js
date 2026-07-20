'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { computeTotals, formatMoney } from '@/lib/totals';

const QUOTE_TYPES = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'album', label: 'Album' },
  { value: 'both', label: 'Wedding + Album' },
];

export default function QuotesList({ initialQuotes }) {
  const router = useRouter();
  const [quotes, setQuotes] = useState(initialQuotes);
  const [clientName, setClientName] = useState('');
  const [quoteType, setQuoteType] = useState('wedding');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch('/api/quotes', { cache: 'no-store' });
    if (res.ok) setQuotes(await res.json());
  }

  async function createQuote(event) {
    event.preventDefault();
    setBusy(true);
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientName, quoteType }),
    });
    setBusy(false);
    if (res.ok) {
      const { slug } = await res.json();
      router.push(`/q/${slug}`);
    }
  }

  async function deleteQuote(quote) {
    const label = quote.clientName || 'this quote';
    if (!window.confirm(`Delete the quote for ${label}? This cannot be undone.`)) return;
    await fetch(`/api/quotes/${quote.id}`, { method: 'DELETE' });
    await refresh();
  }

  return (
    <>
      <div className="admin-title-row">
        <h1 className="admin-title">Quotes</h1>
      </div>

      <div className="panel">
        <form className="accept-row" onSubmit={createQuote}>
          <input
            className="accept-input"
            style={{ fontFamily: 'inherit', fontSize: 14 }}
            placeholder="Client name, e.g. Kelly & Nelson"
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
          />
          <select
            value={quoteType}
            onChange={(event) => setQuoteType(event.target.value)}
            style={{ padding: '11px 10px', border: '1px solid var(--anp-rule)', background: '#fff' }}
          >
            {QUOTE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <button className="btn" disabled={busy}>
            New quote
          </button>
        </form>
        <p className="muted" style={{ margin: '10px 0 0' }}>
          A new quote copies the matching collections and add-ons from your catalog, then
          opens the live page. Share your screen there and click as you talk - it saves
          itself, and the client's copy of the link follows along.
        </p>
      </div>

      <div className="panel">
        {quotes.length === 0 ? (
          <p className="muted">No quotes yet. Create the first one above.</p>
        ) : (
          <table className="list-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Status</th>
                <th>Total</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => {
                const totals = computeTotals(quote.items, quote.taxRate);
                return (
                  <tr key={quote.id}>
                    <td className="cell-name">
                      <Link href={`/q/${quote.slug}`}>
                        {quote.clientName || 'Unnamed quote'}
                      </Link>
                      {quote.signatureName ? (
                        <div className="muted">Signed by {quote.signatureName}</div>
                      ) : null}
                    </td>
                    <td>
                      <span className={`status-pill ${quote.status}`}>{quote.status}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--anp-blue)' }}>
                      {formatMoney(totals.totalCents)}
                    </td>
                    <td className="muted">
                      {new Date(quote.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Link className="btn ghost small" href={`/q/${quote.slug}`}>
                        Open
                      </Link>{' '}
                      <button className="btn danger small" onClick={() => deleteQuote(quote)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
