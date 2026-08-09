"use client";

/**
 * Client fetch wrapper with transparent access-token refresh.
 *
 * Server-sent cookies are enough for most requests, but access tokens expire
 * after 15 minutes. When a request comes back 401, this wrapper calls
 * POST /api/auth/refresh once (rotating both cookies) and retries the original
 * request. If the refresh itself fails, the original 401 response is returned
 * and the caller surfaces the "session expired" state.
 *
 * Concurrent 401s share a single refresh so the rotation is not fought over.
 */

let refreshPromise: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch("/api/auth/refresh", { method: "POST" })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const perform = () =>
    fetch(input, { ...init, credentials: "same-origin" });

  const response = await perform();

  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return perform();
    }
  }

  return response;
}
