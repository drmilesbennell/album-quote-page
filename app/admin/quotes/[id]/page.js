import { notFound } from 'next/navigation';
import { getQuote, getSettings } from '@/lib/data';
import QuoteEditor from './QuoteEditor';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Edit quote · Admin' };

export default async function EditQuotePage({ params }) {
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) notFound();
  const settings = await getSettings();
  return <QuoteEditor initialQuote={quote} settings={settings} />;
}
