import { AdminLayout } from '@/src/components/layout-components/admin-layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
}
