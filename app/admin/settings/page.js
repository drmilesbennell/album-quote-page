import { getSettings } from '@/lib/data';
import SettingsForm from './SettingsForm';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Settings · Admin' };

export default async function SettingsPage() {
  const settings = await getSettings();
  return <SettingsForm initialSettings={settings} />;
}
