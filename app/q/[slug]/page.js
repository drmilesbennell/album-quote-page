import { notFound } from 'next/navigation';
import ClientQuote from '@/components/ClientQuote';
import { getQuoteBySlug, getSettings } from '@/lib/data';
import { missingDatabaseUrl } from '@/lib/db';
import SetupNotice from '@/components/SetupNotice';
import { publicQuote, publicSettings } from '@/lib/public';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  if (missingDatabaseUrl()) return { title: 'Quote' };
  const settings = await getSettings();
  return { title: `Quote · ${settings.businessName}` };
}

export default async function QuotePage({ params }) {
  if (missingDatabaseUrl()) return <SetupNotice />;
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
