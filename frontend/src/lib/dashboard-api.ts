import { getAuthToken } from './auth';
import type { DashboardStatisticsResponse } from '@/src/types/dashboard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export async function fetchDashboardStatistics(): Promise<DashboardStatisticsResponse> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/admin/dashboard/statistics`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard statistics: ${res.status}`);
  }

  return res.json();
}
