import { apiFetch } from './api';
import { getAuthToken } from './auth';

export interface Setting {
  key: string;
  value: string | null;
  group: string;
  type: string;
  label: string | null;
}

export async function getSettings() {
  return apiFetch<{ data: Record<string, Record<string, string | null>> }>('/settings');
}

export async function getSettingsByGroup(group: string) {
  return apiFetch<{ data: Record<string, string | null> }>(`/settings/${group}`);
}

export async function updateSettings(settings: Record<string, string | null>) {
  const token = getAuthToken();
  return apiFetch('/admin/settings', {
    method: 'PUT',
    token: token || undefined,
    body: JSON.stringify(settings),
  });
}

export async function updateSingleSetting(key: string, data: Partial<Setting>) {
  const token = getAuthToken();
  return apiFetch(`/admin/settings/${key}`, {
    method: 'PUT',
    token: token || undefined,
    body: JSON.stringify(data),
  });
}
