import { AdminLayout } from '@/src/components/layout-components/admin-layout';
import { DashboardOverview } from '@/src/features/dashboard/overview';
import { PageWrapper } from '@/src/components/layout-components/page-wrapper';

export default function DashboardPage() {
  return (
    <AdminLayout>
      <PageWrapper>
        <DashboardOverview />
      </PageWrapper>
    </AdminLayout>
  );
}
