import type { Metadata } from 'next';
import AdminShell from '@/src/components/admin/AdminShell';

export const metadata: Metadata = {
  title: 'Admin | Global Invitation',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
