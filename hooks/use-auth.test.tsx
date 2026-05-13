import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  authQueryKeys,
  useChangePasswordMutation,
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
  useRecoverWithPhraseMutation,
} from "@/hooks/use-auth";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("auth TanStack Query hooks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://backend.example.test";
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it("fetches the current user from the external backend with credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        id: "u1",
        email: "user@example.com",
        name: "User",
        role: "ADMIN",
        mustChangePassword: false,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useMeQuery(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock).toHaveBeenCalledWith(
      "https://backend.example.test/auth/me",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("refreshes once when the current-user request is unauthorized", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ message: "Unauthorized" }, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        Response.json({
          id: "u1",
          email: "user@example.com",
          name: "User",
          role: "ADMIN",
          mustChangePassword: false,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useMeQuery(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://backend.example.test/auth/refresh",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("sets session data and toast feedback after successful login", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          id: "u1",
          email: "user@example.com",
          name: "User",
          role: "SALES",
          mustChangePassword: false,
        }),
      ),
    );

    const { result } = renderHook(() => useLoginMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({
      email: "user@example.com",
      password: "secret",
    });

    expect(queryClient.getQueryData(authQueryKeys.me)).toMatchObject({ id: "u1" });
    expect(toast.success).toHaveBeenCalledWith("Sesión iniciada.");
  });

  it("clears auth state after logout even when backend logout partially fails", async () => {
    queryClient.setQueryData(authQueryKeys.me, { id: "u1" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

    const { result } = renderHook(() => useLogoutMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(result.current.mutateAsync()).rejects.toThrow("Auth request failed");

    expect(queryClient.getQueryData(authQueryKeys.me)).toBeUndefined();
    expect(toast.success).toHaveBeenCalledWith("Sesión cerrada.");
  });

  it("clears session after password change and asks for fresh authentication", async () => {
    queryClient.setQueryData(authQueryKeys.me, { id: "u1" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ id: "u1" })));

    const { result } = renderHook(() => useChangePasswordMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({
      currentPassword: "oldpass123",
      newPassword: "newpass123",
    });

    expect(queryClient.getQueryData(authQueryKeys.me)).toBeUndefined();
    expect(toast.success).toHaveBeenCalledWith(
      "Contraseña actualizada. Iniciá sesión nuevamente.",
    );
  });

  it("uses generic or lockout recovery failure toasts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ message: "Rate limited" }, { status: 429 }),
      ),
    );

    const { result } = renderHook(() => useRecoverWithPhraseMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync({
        email: "user@example.com",
        recoveryPhrase: "uno dos tres cuatro cinco seis siete ocho",
        newPassword: "newpass123",
      }),
    ).rejects.toThrow("Rate limited");

    expect(toast.error).toHaveBeenCalledWith(
      "Demasiados intentos. Esperá y probá nuevamente.",
    );
  });
});
