import { notFound } from 'next/navigation';
import ClientQuote from '@/components/ClientQuote';
import { getQuoteBySlug, getSettings } from '@/lib/data';
import { publicQuote, publicSettings } from '@/lib/public';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const settings = await getSettings();
  return { title: `Quote · ${settings.businessName}` };
}

export default async function QuotePage({ params }) {
  const { slug } = await params;
  const quote = await getQuoteBySlug(slug);
  if (!quote) notFound();
  const settings = await getSettings();
  return (
    <ClientQuote
      initialQuote={publicQuote(quote)}
      initialSettings={publicSettings(settings)}
    />
  );
}
