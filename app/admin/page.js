import { listQuotes } from '@/lib/data';
import QuotesList from './QuotesList';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Quotes · Admin' };

export default async function AdminHome() {
  const quotes = await listQuotes();
  return <QuotesList initialQuotes={quotes} />;
}
