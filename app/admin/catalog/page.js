import { listCollections, listAddons } from '@/lib/data';
import CatalogEditor from './CatalogEditor';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Collections & Add-ons · Admin' };

export default async function CatalogPage() {
  const [collections, addons] = await Promise.all([listCollections(), listAddons()]);
  return <CatalogEditor initialCollections={collections} initialAddons={addons} />;
}
