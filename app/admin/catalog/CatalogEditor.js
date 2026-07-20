'use client';

import { useState } from 'react';
import { formatMoney, parseMoney } from '@/lib/totals';

// Manages the reusable catalog. Edits here shape NEW quotes only - existing
// quotes keep the snapshot they were created with, so sent links never shift.

function moveItem(list, index, delta) {
  const next = [...list];
  const target = index + delta;
  if (target < 0 || target >= next.length) return list;
  [next[index], next[target]] = [next[target], next[index]];
  return next.map((item, i) => ({ ...item, position: i + 1 }));
}

const ADDON_CATEGORIES = [
  { value: 'both', label: 'Wedding + album quotes' },
  { value: 'wedding', label: 'Wedding quotes only' },
  { value: 'album', label: 'Album quotes only' },
];

function EntryCard({ entry, fields, onChange, onSave, onDelete, onMove, saveState }) {
  return (
    <div className="panel">
      <div className="field-row">
        <div className="field" style={{ flex: 2 }}>
          <label>Name</label>
          <input
            type="text"
            value={entry.name}
            onChange={(event) => onChange({ ...entry, name: event.target.value })}
          />
        </div>
        <div className="field">
          <label>{fields.priceLabel}</label>
          <input
            type="text"
            value={entry.priceText}
            onChange={(event) => onChange({ ...entry, priceText: event.target.value })}
          />
        </div>
        {fields.categorySelect ? (
          <div className="field">
            <label>Appears on</label>
            <select
              value={entry.category}
              onChange={(event) => onChange({ ...entry, category: event.target.value })}
              style={{ width: '100%', padding: '9px 8px', border: '1px solid var(--anp-rule)', background: '#fff' }}
            >
              {ADDON_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {fields.parentOptions ? (
          <div className="field">
            <label>Attach under</label>
            <select
              value={entry.parentCollectionId || ''}
              onChange={(event) => onChange({ ...entry, parentCollectionId: event.target.value })}
              style={{ width: '100%', padding: '9px 8px', border: '1px solid var(--anp-rule)', background: '#fff' }}
            >
              <option value="">Standalone line</option>
              {fields.parentOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  Under {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      <div className="field">
        <label>{fields.descLabel}</label>
        <textarea
          value={entry.descText}
          onChange={(event) => onChange({ ...entry, descText: event.target.value })}
          placeholder={fields.descPlaceholder}
        />
      </div>
      {fields.hasFootnote ? (
        <div className="field">
          <label>Fine print</label>
          <textarea
            value={entry.footText}
            onChange={(event) => onChange({ ...entry, footText: event.target.value })}
            placeholder={'Shown under the inclusions in smaller text, e.g.\nDiscounts\n- Additional pages $65 ea.'}
          />
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn small" onClick={onSave}>
          Save
        </button>
        <label className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={entry.active}
            onChange={(event) => onChange({ ...entry, active: event.target.checked })}
          />
          Include on new quotes
        </label>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="icon-btn" title="Move up" onClick={() => onMove(-1)}>
          ▲
        </button>
        <button className="icon-btn" title="Move down" onClick={() => onMove(1)}>
          ▼
        </button>
        <button className="btn danger small" onClick={onDelete}>
          Delete
        </button>
        <span className="save-state">{saveState}</span>
      </div>
    </div>
  );
}

export default function CatalogEditor({ initialCollections, initialAddons }) {
  const [collections, setCollections] = useState(
    initialCollections.map((c) => ({
      ...c,
      priceText: formatMoney(c.priceCents),
      descText: c.includes,
      footText: c.discounts,
    }))
  );
  const [addons, setAddons] = useState(
    initialAddons.map((a) => ({
      ...a,
      priceText: formatMoney(a.unitPriceCents),
      descText: a.description,
    }))
  );
  const [saveStates, setSaveStates] = useState({});

  function setSaveState(id, text) {
    setSaveStates((prev) => ({ ...prev, [id]: text }));
    if (text === 'Saved') {
      setTimeout(() => setSaveStates((prev) => ({ ...prev, [id]: '' })), 2000);
    }
  }

  async function saveCollection(entry) {
    setSaveState(entry.id, 'Saving…');
    const res = await fetch(`/api/collections/${entry.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: entry.name,
        priceCents: parseMoney(entry.priceText),
        includes: entry.descText,
        discounts: entry.footText,
        position: entry.position,
        active: entry.active,
        category: entry.category,
      }),
    });
    setSaveState(entry.id, res.ok ? 'Saved' : 'Save failed');
  }

  async function saveAddon(entry) {
    setSaveState(entry.id, 'Saving…');
    const res = await fetch(`/api/addons/${entry.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: entry.name,
        unitPriceCents: parseMoney(entry.priceText),
        description: entry.descText,
        position: entry.position,
        active: entry.active,
        category: entry.category,
        parentCollectionId: entry.parentCollectionId || '',
      }),
    });
    setSaveState(entry.id, res.ok ? 'Saved' : 'Save failed');
  }

  async function addCollection(category) {
    const name = category === 'album' ? 'New Album Collection' : 'New Collection';
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category }),
    });
    if (res.ok) {
      const { id } = await res.json();
      setCollections((prev) => [
        ...prev,
        {
          id,
          name,
          priceText: '$0.00',
          descText: '',
          footText: '',
          position: prev.length + 1,
          active: true,
          category,
        },
      ]);
    }
  }

  async function addAddon() {
    const res = await fetch('/api/addons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Add-on', category: 'both' }),
    });
    if (res.ok) {
      const { id } = await res.json();
      setAddons((prev) => [
        ...prev,
        {
          id,
          name: 'New Add-on',
          priceText: '$0.00',
          descText: '',
          position: prev.length + 1,
          active: true,
          category: 'both',
        },
      ]);
    }
  }

  async function deleteEntry(kind, entry) {
    if (!window.confirm(`Delete "${entry.name}"? Existing quotes keep their copy of it.`)) return;
    await fetch(`/api/${kind}/${entry.id}`, { method: 'DELETE' });
    if (kind === 'collections') setCollections((prev) => prev.filter((c) => c.id !== entry.id));
    else setAddons((prev) => prev.filter((a) => a.id !== entry.id));
  }

  async function moveCollection(entry, delta) {
    // Reorder within the entry's own section, then renumber everything.
    const subset = collections.filter((c) => c.category === entry.category);
    const others = collections.filter((c) => c.category !== entry.category);
    const index = subset.findIndex((c) => c.id === entry.id);
    const movedSubset = moveItem(subset, index, delta);
    if (movedSubset === subset) return;
    const next = [
      ...(entry.category === 'wedding' ? movedSubset : others),
      ...(entry.category === 'wedding' ? others : movedSubset),
    ].map((item, i) => ({ ...item, position: i + 1 }));
    setCollections(next);
    for (const item of next) await saveCollection(item);
  }

  async function moveAddon(index, delta) {
    const next = moveItem(addons, index, delta);
    setAddons(next);
    for (const entry of next) await saveAddon(entry);
  }

  function collectionSection(category, heading, blurb) {
    const list = collections.filter((c) => c.category === category);
    return (
      <>
        <h2 className="panel-heading">{heading}</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: 16 }}>
          {blurb}
        </p>
        {list.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            fields={{
              priceLabel: 'Price',
              descLabel: 'Included in this collection',
              descPlaceholder:
                'One inclusion per line, e.g.\n24x36 Acrylic\nAlbum Presentation Box\n30 pages in Album',
              hasFootnote: true,
            }}
            onChange={(updated) =>
              setCollections((prev) => prev.map((c) => (c.id === entry.id ? updated : c)))
            }
            onSave={() => saveCollection(entry)}
            onDelete={() => deleteEntry('collections', entry)}
            onMove={(delta) => moveCollection(entry, delta)}
            saveState={saveStates[entry.id] || ''}
          />
        ))}
        <button className="btn ghost" onClick={() => addCollection(category)} style={{ marginBottom: 34 }}>
          Add {category === 'album' ? 'album collection' : 'wedding collection'}
        </button>
      </>
    );
  }

  return (
    <>
      <div className="admin-title-row">
        <h1 className="admin-title">Collections &amp; Add-ons</h1>
      </div>
      <p className="muted" style={{ marginTop: 0, marginBottom: 20 }}>
        This catalog is the starting point for every new quote. Editing it never changes
        quotes you have already created or sent.
      </p>

      {collectionSection(
        'wedding',
        'Wedding Collections',
        'Shown on wedding quotes.'
      )}
      {collectionSection(
        'album',
        'Album Collections',
        'Post-wedding album collections, shown on album quotes.'
      )}

      <h2 className="panel-heading">Add-ons</h2>
      <p className="muted" style={{ marginTop: 0, marginBottom: 16 }}>
        Add-ons get a quantity box on the quote, e.g. extra album pages or additional
        hours. Choose which kind of quote each one appears on. An add-on attached under
        a collection sits indented beneath it and only appears on quotes that include
        that collection - use this for per-collection page rates.
      </p>
      {addons.map((entry, index) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          fields={{
            priceLabel: 'Price per unit',
            descLabel: 'Description',
            descPlaceholder: 'Optional, shown under the name',
            hasFootnote: false,
            categorySelect: true,
            parentOptions: collections.map((c) => ({ id: c.id, name: c.name })),
          }}
          onChange={(updated) =>
            setAddons((prev) => prev.map((a) => (a.id === entry.id ? updated : a)))
          }
          onSave={() => saveAddon(entry)}
          onDelete={() => deleteEntry('addons', entry)}
          onMove={(delta) => moveAddon(index, delta)}
          saveState={saveStates[entry.id] || ''}
        />
      ))}
      <button className="btn ghost" onClick={addAddon}>
        Add add-on
      </button>
    </>
  );
}
