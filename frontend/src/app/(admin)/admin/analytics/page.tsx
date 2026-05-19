import { AnalyticsPage } from '@/src/features/admin-analytics/analytics-page';
import { AdminLayout } from '@/src/components/layout-components/admin-layout';
import { PageWrapper } from '@/src/components/layout-components/page-wrapper';

export default function AdminAnalyticsPage() {
  return (
    <AdminLayout>
      <PageWrapper>
        <AnalyticsPage />
      </PageWrapper>
    </AdminLayout>
  );
}
