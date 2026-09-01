import PaymentsClient, { type AdminPaymentsTab } from './PaymentsClient';

function parsePaymentsTab(value?: string | string[]): AdminPaymentsTab {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'pricing' || raw === 'toss') return raw;
  return 'transactions';
}

export default function AdminPaymentsPage({
  searchParams,
}: {
  searchParams?: { tab?: string | string[] };
}) {
  return <PaymentsClient initialTab={parsePaymentsTab(searchParams?.tab)} />;
}
