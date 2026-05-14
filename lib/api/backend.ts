import { BackendRequestError, type BackendErrorPayload } from "@/lib/api/errors";

export type BackendFetchOptions = RequestInit & {
  refreshOnUnauthorized?: boolean;
};

export function getApiBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (!value) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_BASE_URL. Add it to .env.local (see .env.example).",
    );
  }

  return value.replace(/\/$/, "");
}

export function buildBackendUrl(path: string) {
  return new URL(path, getApiBaseUrl()).toString();
}

export async function backendFetch<T>(
  path: string,
  init: BackendFetchOptions = {},
) {
  const { refreshOnUnauthorized = false, ...requestInit } = init;
  const response = await fetchBackendUrl(path, requestInit);

  if (response.status === 401 && refreshOnUnauthorized) {
    const refreshed = await refreshSession();

    if (refreshed) {
      return parseBackendResponse<T>(await fetchBackendUrl(path, requestInit));
    }
  }

  return parseBackendResponse<T>(response);
}

export async function normalizeBackendError(
  response: Response,
): Promise<BackendErrorPayload> {
  const fallback = response.statusText || "Backend request failed";

  try {
    const payload = (await response.clone().json()) as {
      message?: string | string[];
      error?: string;
      statusCode?: number;
    };
    const message = Array.isArray(payload.message)
      ? payload.message.join(" ")
      : payload.message || payload.error || fallback;

    return {
      message,
      statusCode: payload.statusCode ?? response.status,
    };
  } catch {
    return {
      message: fallback,
      statusCode: response.status,
    };
  }
}

async function fetchBackendUrl(path: string, init: RequestInit) {
  return fetch(buildBackendUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...init.headers,
    },
  });
}

async function refreshSession() {
  try {
    const response = await fetchBackendUrl("/auth/refresh", { method: "POST" });
    return response.ok;
  } catch {
    return false;
  }
}

async function parseBackendResponse<T>(response: Response) {
  if (!response.ok) {
    throw new BackendRequestError(await normalizeBackendError(response));
  }

  if (response.status === 204) {
    return { success: true } as T;
  }

  return (await response.json()) as T;
}
