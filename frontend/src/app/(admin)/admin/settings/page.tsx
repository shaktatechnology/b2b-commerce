import { AdminLayout } from '@/src/components/layout-components/admin-layout';
import { PageWrapper } from '@/src/components/layout-components/page-wrapper';
import { SettingsForm } from '@/src/components/admin-components/settings-form';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function getInitialData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) return { settings: {}, socialLinks: [] };

  try {
    const [settingsRes, socialRes] = await Promise.all([
      fetch(`${API_URL}/settings`, {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      }),
      fetch(`${API_URL}/admin/social-links`, {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      })
    ]);

    const settingsData = await settingsRes.json();
    const socialData = await socialRes.json();

    // Flatten settings like the client does
    const flatSettings: Record<string, any> = {};
    if (settingsData.data) {
      Object.values(settingsData.data).forEach((group: any) => {
        if (group && typeof group === 'object') {
          Object.entries(group).forEach(([key, val]) => { flatSettings[key] = val; });
        }
      });
    }

    return {
      settings: flatSettings,
      socialLinks: socialData.data || []
    };
  } catch (error) {
    console.error('Server-side fetch failed:', error);
    return { settings: {}, socialLinks: [] };
  }
}

export default async function AdminSettingsPage() {
  const { settings, socialLinks } = await getInitialData();

  return (
    <AdminLayout>
      <PageWrapper>
        <SettingsForm 
          initialSettings={settings} 
          initialSocialLinks={socialLinks} 
        />
      </PageWrapper>
    </AdminLayout>
  );
}
