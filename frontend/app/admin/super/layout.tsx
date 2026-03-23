import SuperAdminShell from '@/src/components/admin/super/SuperAdminShell';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <SuperAdminShell>{children}</SuperAdminShell>;
}
