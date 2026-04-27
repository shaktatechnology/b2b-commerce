import { AdminLayout } from '@/src/components/layout-components/admin-layout';
import { PageWrapper, PageHeader } from '@/src/components/layout-components/page-wrapper';
import { SettingsForm } from '@/src/components/admin-components/settings-form';

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <PageWrapper>
        <PageHeader 
          title="Website Settings" 
          description="Configure your website's general information, SEO, contact details, and appearance."
        />
        <SettingsForm />
      </PageWrapper>
    </AdminLayout>
  );
}
