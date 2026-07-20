import { formatMoney } from '@/lib/totals';

// The in-card totals block. On screen the sticky totals bar mirrors these
// numbers; in print this block is the record.
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
