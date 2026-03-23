import type { Metadata } from 'next';
import AdminLayoutBody from './AdminLayoutBody';

export const metadata: Metadata = {
  title: 'Admin | Global Invitation',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutBody>{children}</AdminLayoutBody>;
}
