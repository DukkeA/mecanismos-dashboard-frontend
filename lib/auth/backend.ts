import {
  backendFetch,
  buildBackendUrl,
  getApiBaseUrl,
  normalizeBackendError,
} from "@/lib/api/backend";
import { AuthRequestError, type AuthErrorPayload } from "@/lib/auth/types";

type AuthFetchOptions = RequestInit & {
  refreshOnUnauthorized?: boolean;
};

export function buildBackendAuthUrl(path: string) {
  return buildBackendUrl(path);
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
  try {
    return await backendFetch<T>(path, init);
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      const message =
        error.message === "Backend request failed"
          ? "Auth request failed"
          : error.message;

      throw new AuthRequestError({
        message,
        statusCode: Number(error.statusCode),
      });
    }

    throw error;
  }
}

export async function normalizeAuthError(
  response: Response,
): Promise<AuthErrorPayload> {
  const fallback = response.statusText || "Auth request failed";

  try {
    return await normalizeBackendError(response);
  } catch {
    return {
      message: fallback,
      statusCode: response.status,
    };
  }
}

export { getApiBaseUrl };
