const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type FetchOptions = RequestInit & {
  token?: string;
};

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, headers, ...rest } = options;

  const isFormData = rest.body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
  });

  let data: any = {};
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  }

  if (!res.ok) {
    // Normalise Laravel validation errors + generic messages
    const message =
      data?.message ||
      Object.values(data ?? {})
        .flat()
        .join(' ') ||
      'Something went wrong';
    throw new Error(message);
  }

  return data as T;
}
