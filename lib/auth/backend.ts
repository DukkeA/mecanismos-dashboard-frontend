import { AuthRequestError, type AuthErrorPayload } from "@/lib/auth/types";

type AuthFetchOptions = RequestInit & {
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

export function buildBackendAuthUrl(path: string) {
  return new URL(path, getApiBaseUrl()).toString();
}

export function sanitizeNextPath(rawValue: string | null, fallback = "/dashboard") {
  if (!rawValue?.startsWith("/")) {
    return fallback;
  }

  if (rawValue.startsWith("//") || rawValue.startsWith("/auth/refresh")) {
    return fallback;
  }

  return rawValue;
}

export async function authFetch<T>(path: string, init: AuthFetchOptions = {}) {
  const { refreshOnUnauthorized = false, ...requestInit } = init;
  const response = await fetchAuthUrl(path, requestInit);

  if (response.status === 401 && refreshOnUnauthorized) {
    const refreshed = await refreshSession();

    if (refreshed) {
      const retryResponse = await fetchAuthUrl(path, requestInit);
      return parseAuthResponse<T>(retryResponse);
    }
  }

  return parseAuthResponse<T>(response);
}

export async function normalizeAuthError(
  response: Response,
): Promise<AuthErrorPayload> {
  const fallback = response.statusText || "Auth request failed";

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

async function fetchAuthUrl(path: string, init: RequestInit) {
  return fetch(buildBackendAuthUrl(path), {
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
    const response = await fetchAuthUrl("/auth/refresh", { method: "POST" });
    return response.ok;
  } catch {
    return false;
  }
}

async function parseAuthResponse<T>(response: Response) {
  if (!response.ok) {
    throw new AuthRequestError(await normalizeAuthError(response));
  }

  if (response.status === 204) {
    return { success: true } as T;
  }

  return (await response.json()) as T;
}
