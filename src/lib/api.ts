export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string; status: number }> {
  try {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include', // Include cookies for auth
    });

    const data: T = await response.json();

    if (!response.ok) {
      const errorMessage =
        typeof data === 'object' && data !== null && 'error' in data
          ? (data as any).error
          : 'Request failed';
      return { error: errorMessage, status: response.status };
    }

    return { data, status: response.status };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown network error';
    return { error: `Network error: ${message}`, status: 0 };
  }
}

// Auth API helpers
export async function register(email: string, password: string) {
  return apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string) {
  return apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return apiCall('/auth/logout', { method: 'POST' });
}
