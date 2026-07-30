import { Suspense } from 'react';
import AdminLoginForm from './AdminLoginForm';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
