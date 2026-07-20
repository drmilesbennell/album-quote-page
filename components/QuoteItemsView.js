import { computeTotals, formatMoney, lineTotalCents } from '@/lib/totals';

// Read-only rendering of a quote's line items and totals, used by the
// client-facing page. Checkboxes and quantities reflect the photographer's
// current selections but cannot be changed here.
export default function QuoteItemsView({ items, taxRate }) {
  const totals = computeTotals(items, taxRate);
  return (
    <>
      <div className="item-table">
        {items.map((item) => (
          <div className="item-row" key={item.key}>
            <div className="item-check">
              <input type="checkbox" checked={!!item.selected} readOnly disabled />
            </div>
            <div className="item-main">
              <p className="item-name">{item.name}</p>
              {item.description ? <p className="item-desc">{item.description}</p> : null}
              {item.footnote ? <p className="item-footnote">{item.footnote}</p> : null}
            </div>
            {item.kind === 'addon' ? (
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
    </>
  );
}

export function QuoteTotals({ totals }) {
  return (
    <div className="totals">
      <table>
        <tbody>
          <tr>
            <td className="totals-label">Subtotal</td>
            <td className="totals-value">{formatMoney(totals.subtotalCents)}</td>
          </tr>
          <tr>
            <td className="totals-label">
              Tax{totals.taxRate ? ` (${totals.taxRate}%)` : ''}
            </td>
            <td className="totals-value">{formatMoney(totals.taxCents)}</td>
          </tr>
          <tr className="grand">
            <td className="totals-label">Total</td>
            <td className="totals-value">{formatMoney(totals.totalCents)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
