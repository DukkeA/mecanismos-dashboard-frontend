import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  customersQueryKeys,
  useCreateCustomerMutation,
  useCustomerQuery,
  useCustomerOptionsQuery,
  useCustomersQuery,
  useCustomerSearchQuery,
  useUpdateCustomerMutation,
} from "@/hooks/use-customers";

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

describe("customer TanStack Query hooks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://backend.example.test";
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it("fetches list, detail, and search with credentialed customer endpoints", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          data: [{ id: "c1", name: "Acme", documentNumber: "30" }],
          meta: { page: 2, limit: 20, total: 1, totalPages: 1 },
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ id: "c1", name: "Acme", documentNumber: "30" }),
      )
      .mockResolvedValueOnce(
        Response.json([{ id: "c1", name: "Acme", documentNumber: "30" }]),
      )
      .mockResolvedValueOnce(
        Response.json({ data: [{ id: "c1", label: "Acme", description: "30" }] }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const list = renderHook(
      () =>
        useCustomersQuery({
          page: 2,
          limit: 20,
          search: "acme",
          isActive: true,
          sortBy: "name",
          sortDir: "asc",
        }),
      { wrapper: createWrapper(queryClient) },
    );
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));

    const detail = renderHook(() => useCustomerQuery("c1"), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(detail.result.current.isSuccess).toBe(true));

    const search = renderHook(() => useCustomerSearchQuery({ search: "ac", limit: 5 }), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(search.result.current.isSuccess).toBe(true));

    const options = renderHook(() => useCustomerOptionsQuery({ search: "ac", limit: 5, isActive: true }), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(options.result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://backend.example.test/customers?page=2&limit=20&search=acme&isActive=true&sortBy=name&sortDir=asc",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://backend.example.test/customers/c1",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://backend.example.test/customers/options?search=ac&limit=5",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "https://backend.example.test/customers/options?search=ac&limit=5&isActive=true",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("invalidates customer data and preserves cache on mutation failure", async () => {
    queryClient.setQueryData(customersQueryKeys.detail("c1"), { id: "c1", name: "Old" });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ id: "c2", name: "Nuevo", documentNumber: "31" }),
      )
      .mockResolvedValueOnce(Response.json({ message: "No" }, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    const create = renderHook(() => useCreateCustomerMutation(), {
      wrapper: createWrapper(queryClient),
    });
    await create.result.current.mutateAsync({
      name: "Nuevo",
      documentType: "NIT",
      documentNumber: "31",
      phone: "291 555-0101",
      status: "active",
    });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({
      name: "Nuevo",
      documentType: "NIT",
      documentNumber: "31",
      phone: "291 555-0101",
      isActive: true,
    });

    expect(toast.success).toHaveBeenCalledWith("Cliente creado.");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: customersQueryKeys.lists() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: customersQueryKeys.searches() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: customersQueryKeys.details() });

    const update = renderHook(() => useUpdateCustomerMutation(), {
      wrapper: createWrapper(queryClient),
    });
    await expect(
      update.result.current.mutateAsync({
        id: "c1",
        input: { name: "Fallido", documentType: "CEDULA", documentNumber: "30", phone: "291 555-0102", status: "inactive" },
      }),
    ).rejects.toThrow("No");

    const updateBody = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(updateBody).toMatchObject({ documentType: "CEDULA", isActive: false });
    expect(updateBody).not.toHaveProperty("status");
    expect(updateBody).not.toHaveProperty("address");

    expect(queryClient.getQueryData(customersQueryKeys.detail("c1"))).toMatchObject({
      name: "Old",
    });
    expect(toast.error).toHaveBeenCalledWith(
      "No pudimos guardar los cambios del cliente.",
    );
  });
});
