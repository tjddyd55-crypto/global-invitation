import AdminSystemClient, { type AdminSystemTab } from './SystemClient';

function parseSystemTab(value?: string | string[]): AdminSystemTab {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'figma' || raw === 'audit') return raw;
  return 'runtime';
}

export default function AdminSystemPage({
  searchParams,
}: {
  searchParams?: { tab?: string | string[] };
}) {
  return <AdminSystemClient initialTab={parseSystemTab(searchParams?.tab)} />;
}
