import { apiFetch } from './api';
import { getAuthToken } from './auth';

export interface SocialLink {
  id: number;
  platform: string;
  label: string | null;
  url: string;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
}

export async function getSocialLinks() {
  return apiFetch<{ data: SocialLink[] }>('/social-links');
}

export async function getAdminSocialLinks() {
  const token = getAuthToken();
  return apiFetch<{ data: SocialLink[] }>('/admin/social-links', {
    token: token || undefined,
  });
}

export async function createSocialLink(data: Omit<SocialLink, 'id'>) {
  const token = getAuthToken();
  return apiFetch<{ data: SocialLink }>('/admin/social-links', {
    method: 'POST',
    token: token || undefined,
    body: JSON.stringify(data),
  });
}

export async function updateSocialLink(id: number, data: Partial<SocialLink>) {
  const token = getAuthToken();
  return apiFetch<{ data: SocialLink }>(`/admin/social-links/${id}`, {
    method: 'PUT',
    token: token || undefined,
    body: JSON.stringify(data),
  });
}

export async function deleteSocialLink(id: number) {
  const token = getAuthToken();
  return apiFetch(`/admin/social-links/${id}`, {
    method: 'DELETE',
    token: token || undefined,
  });
}
