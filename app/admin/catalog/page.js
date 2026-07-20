import { listCollections, listAddons } from '@/lib/data';
import { ensureSeeded } from '@/lib/db';
import CatalogEditor from './CatalogEditor';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Collections & Add-ons · Admin' };

export default async function CatalogPage() {
  await ensureSeeded();
  const [collections, addons] = await Promise.all([listCollections(), listAddons()]);
  return <CatalogEditor initialCollections={collections} initialAddons={addons} />;
}
