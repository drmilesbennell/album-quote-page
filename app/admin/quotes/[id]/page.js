import { notFound, redirect } from 'next/navigation';
import { getQuote } from '@/lib/data';

export const dynamic = 'force-dynamic';

// The separate editor screen is gone - the quote page itself is editable when
// signed in. Old editor links land here and bounce to the live page.
export default async function EditQuotePage({ params }) {
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) notFound();
  redirect(`/q/${quote.slug}`);
}
