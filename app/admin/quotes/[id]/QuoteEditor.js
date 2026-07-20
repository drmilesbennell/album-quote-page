'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { computeTotals, formatMoney, lineTotalCents, parseMoney } from '@/lib/totals';
import { QuoteTotals } from '@/components/QuoteItemsView';

let keyCounter = 0;
function newKey() {
  keyCounter += 1;
  return `item-${Date.now()}-${keyCounter}`;
}

// The working surface for a sales call. Every change autosaves, and the
// client's link (which polls) picks it up within a few seconds.
export default function QuoteEditor({ initialQuote, settings }) {
  const [quote, setQuote] = useState(initialQuote);
  const [saveState, setSaveState] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const saveTimer = useRef(null);
  const quoteRef = useRef(quote);
  quoteRef.current = quote;

  const accepted = quote.status === 'accepted';

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
    saveTimer.current = setTimeout(persist, 700);
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

  function moveItemBy(key, delta) {
    setQuote((prev) => {
      const items = [...prev.items];
      const index = items.findIndex((item) => item.key === key);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= items.length) return prev;
      [items[index], items[target]] = [items[target], items[index]];
      return { ...prev, items };
    });
    scheduleSave();
  }

  function removeItem(key) {
    setQuote((prev) => ({ ...prev, items: prev.items.filter((item) => item.key !== key) }));
    scheduleSave();
  }

  function addCustomItem(kind) {
    const item = {
      key: newKey(),
      kind,
      name: kind === 'addon' ? 'New add-on' : 'New line item',
      description: '',
      footnote: '',
      unitPriceCents: 0,
      qty: kind === 'addon' ? 0 : 1,
      selected: false,
    };
    setQuote((prev) => ({ ...prev, items: [...prev.items, item] }));
    setEditingKey(item.key);
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

  const totals = computeTotals(quote.items, quote.taxRate);
  const clientUrl = `/q/${quote.slug}`;

  return (
    <div className="editor-layout">
      <div className="editor-main">
        <div className="quote-card">
          <div className="quote-head">
            <div>
              <p className="eyebrow">{settings.businessName}</p>
              <h1 className="quote-title">{quote.title || 'Quote'}</h1>
              {quote.clientName ? (
                <p className="quote-client">Prepared for {quote.clientName}</p>
              ) : null}
            </div>
          </div>
          {settings.introText ? <p className="quote-intro">{settings.introText}</p> : null}

          <div className="item-table">
            {quote.items.map((item) => (
              <div key={item.key}>
                <div className="item-row">
                  <div className="item-check">
                    <input
                      type="checkbox"
                      checked={!!item.selected}
                      disabled={accepted}
                      onChange={(event) => updateItem(item.key, { selected: event.target.checked })}
                    />
                  </div>
                  <div className="item-main">
                    <p className="item-name">{item.name}</p>
                    {item.description ? <p className="item-desc">{item.description}</p> : null}
                    {item.footnote ? <p className="item-footnote">{item.footnote}</p> : null}
                  </div>
                  {!accepted ? (
                    <div className="item-tools no-print">
                      <button
                        className="icon-btn"
                        title="Edit this line"
                        onClick={() => setEditingKey(editingKey === item.key ? null : item.key)}
                      >
                        ✎
                      </button>
                      <button className="icon-btn" title="Move up" onClick={() => moveItemBy(item.key, -1)}>
                        ▲
                      </button>
                      <button className="icon-btn" title="Move down" onClick={() => moveItemBy(item.key, 1)}>
                        ▼
                      </button>
                      <button className="icon-btn danger" title="Remove" onClick={() => removeItem(item.key)}>
                        ✕
                      </button>
                    </div>
                  ) : null}
                  {item.kind === 'addon' && !accepted ? (
                    <input
                      className="item-qty"
                      type="number"
                      min="0"
                      value={item.qty}
                      onChange={(event) =>
                        updateItem(item.key, {
                          qty: Math.max(0, Number(event.target.value) || 0),
                          selected: (Number(event.target.value) || 0) > 0,
                        })
                      }
                    />
                  ) : (
                    <div className="item-qty static">{item.qty}</div>
                  )}
                  <div className="item-unit">{formatMoney(item.unitPriceCents)}</div>
                  <div className="item-total">{formatMoney(lineTotalCents(item))}</div>
                </div>

                {editingKey === item.key && !accepted ? (
                  <div className="panel" style={{ marginTop: 0 }}>
                    <div className="field-row">
                      <div className="field" style={{ flex: 2 }}>
                        <label>Name</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(event) => updateItem(item.key, { name: event.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label>{item.kind === 'addon' ? 'Price per unit' : 'Price'}</label>
                        <input
                          type="text"
                          defaultValue={formatMoney(item.unitPriceCents)}
                          onBlur={(event) =>
                            updateItem(item.key, { unitPriceCents: parseMoney(event.target.value) })
                          }
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label>Included / description</label>
                      <textarea
                        value={item.description}
                        onChange={(event) => updateItem(item.key, { description: event.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label>Fine print</label>
                      <textarea
                        value={item.footnote}
                        onChange={(event) => updateItem(item.key, { footnote: event.target.value })}
                      />
                    </div>
                    <button className="btn ghost small" onClick={() => setEditingKey(null)}>
                      Done
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {!accepted ? (
            <div className="no-print" style={{ display: 'flex', gap: 10, margin: '18px 0' }}>
              <button className="btn ghost small" onClick={() => addCustomItem('collection')}>
                Add line item
              </button>
              <button className="btn ghost small" onClick={() => addCustomItem('addon')}>
                Add quantity line
              </button>
            </div>
          ) : null}

          <QuoteTotals totals={totals} />

          {accepted ? (
            <div className="accepted-banner">
              Accepted by <strong>{quote.signatureName}</strong> on{' '}
              {new Date(quote.acceptedAt).toLocaleString('en-US', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}
              . This quote is locked.
            </div>
          ) : null}
        </div>
      </div>

      <div className="editor-side no-print">
        <div className="panel">
          <div className="admin-title-row" style={{ marginBottom: 12 }}>
            <span className="eyebrow" style={{ margin: 0 }}>
              Quote details
            </span>
            <span className={`save-state ${saveState === 'Saving…' ? 'saving' : ''}`}>{saveState}</span>
          </div>
          <div className="field">
            <label>Client name</label>
            <input
              type="text"
              value={quote.clientName}
              disabled={accepted}
              onChange={(event) => update({ clientName: event.target.value })}
            />
          </div>
          <div className="field">
            <label>Client email</label>
            <input
              type="email"
              value={quote.clientEmail}
              disabled={accepted}
              onChange={(event) => update({ clientEmail: event.target.value })}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Title</label>
              <input
                type="text"
                value={quote.title}
                disabled={accepted}
                onChange={(event) => update({ title: event.target.value })}
              />
            </div>
            <div className="field">
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
          </div>
        </div>

        <div className="panel">
          <span className="eyebrow">Client link</span>
          <div className="copy-link-box" style={{ margin: '10px 0' }}>
            <input readOnly value={clientUrl} onFocus={(event) => event.target.select()} />
            <button className="btn ghost small" onClick={copyLink}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="muted" style={{ margin: '0 0 12px' }}>
            The Copy button copies the full address. The page updates for the client within a
            few seconds of your edits here.
          </p>
          <Link className="btn small" href={clientUrl} target="_blank">
            Open client view
          </Link>
        </div>

        {accepted ? (
          <div className="panel">
            <span className="eyebrow">Acceptance record</span>
            <p className="muted" style={{ marginBottom: 0 }}>
              Signed {quote.signatureName}
              <br />
              {new Date(quote.acceptedAt).toLocaleString()}
              {quote.acceptedIp ? (
                <>
                  <br />
                  IP {quote.acceptedIp}
                </>
              ) : null}
              {quote.acceptedTotals ? (
                <>
                  <br />
                  Total at signing {formatMoney(quote.acceptedTotals.totalCents)}
                </>
              ) : null}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
