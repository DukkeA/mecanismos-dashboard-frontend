import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useComponentTypeOptionsQuery } from "@/hooks/use-component-types";
import { componentsQueryKeys, useComponentsQuery, useUpdateComponentMutation } from "@/hooks/use-components";
import { useCreateVehicleMutation, useUpdateVehicleMutation, useVehicleOptionsQuery, useVehiclesQuery, vehiclesQueryKeys } from "@/hooks/use-vehicles";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("asset TanStack Query hooks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://backend.example.test";
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("fetches asset lists and options using supported endpoints only", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ data: [{ id: "v1", customerId: "c1", plate: "AA1", brand: "Volvo", modelReference: "FH" }], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } }))
      .mockResolvedValueOnce(Response.json({ data: [{ id: "p1", customerId: "c1", componentTypeId: "ct1", brand: "Bosch", reference: "ALT", componentType: { id: "ct1", name: "Alternador" } }], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } }))
      .mockResolvedValueOnce(Response.json({ data: [{ id: "v1", label: "AA1", description: "Volvo FH" }] }))
      .mockResolvedValueOnce(Response.json({ data: [{ id: "ct1", label: "Alternador", description: null }] }));
    vi.stubGlobal("fetch", fetchMock);

    const vehicles = renderHook(() => useVehiclesQuery({ page: 1, limit: 10, search: "aa", customerId: "c1" }), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(vehicles.result.current.isSuccess).toBe(true));
    const components = renderHook(() => useComponentsQuery({ page: 1, limit: 10, customerId: "c1", vehicleId: "v1", componentTypeId: "ct1" }), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(components.result.current.isSuccess).toBe(true));
    const vehicleOptions = renderHook(() => useVehicleOptionsQuery({ search: "aa", limit: 5, customerId: "c1" }), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(vehicleOptions.result.current.isSuccess).toBe(true));
    const typeOptions = renderHook(() => useComponentTypeOptionsQuery({ isActive: true, limit: 5 }), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(typeOptions.result.current.isSuccess).toBe(true));

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "https://backend.example.test/vehicles?page=1&limit=10&search=aa&customerId=c1",
      "https://backend.example.test/components?page=1&limit=10&customerId=c1&vehicleId=v1&componentTypeId=ct1",
      "https://backend.example.test/vehicles/options?search=aa&limit=5&customerId=c1",
      "https://backend.example.test/component-types/options?limit=5&isActive=true",
    ]);
  });

  it("invalidates asset caches and sends vehicleId null when clearing component links", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ id: "v1", customerId: "c1", plate: "AA1", brand: "Volvo", modelReference: "FH" }))
      .mockResolvedValueOnce(Response.json({ id: "v1", customerId: "c1", plate: "AA2", brand: "Volvo", modelReference: "FM" }))
      .mockResolvedValueOnce(Response.json({ id: "p1", customerId: "c1", vehicleId: null, componentTypeId: "ct1", brand: "Bosch", reference: "ALT", componentType: { id: "ct1", name: "Alternador" } }));
    vi.stubGlobal("fetch", fetchMock);

    const createVehicle = renderHook(() => useCreateVehicleMutation(), { wrapper: createWrapper(queryClient) });
    await createVehicle.result.current.mutateAsync({ customerId: "c1", brand: "Volvo", modelReference: "FH", plate: "AA1" });
    expect(toast.success).toHaveBeenCalledWith("Vehículo creado.");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: vehiclesQueryKeys.lists() });

    const updateVehicle = renderHook(() => useUpdateVehicleMutation(), { wrapper: createWrapper(queryClient) });
    await updateVehicle.result.current.mutateAsync({ id: "v1", input: { brand: "Volvo", modelReference: "FM", plate: "AA2" } });
    const vehiclePatchBody = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(vehiclePatchBody).toMatchObject({ brand: "Volvo", modelReference: "FM", plate: "AA2" });
    expect(vehiclePatchBody).not.toHaveProperty("customerId");

    const updateComponent = renderHook(() => useUpdateComponentMutation(), { wrapper: createWrapper(queryClient) });
    await updateComponent.result.current.mutateAsync({ id: "p1", input: { componentTypeId: "ct1", vehicleId: null, brand: "Bosch", reference: "ALT" } });
    const componentPatchBody = JSON.parse(fetchMock.mock.calls[2][1].body as string);
    expect(componentPatchBody).toMatchObject({ vehicleId: null });
    expect(componentPatchBody).not.toHaveProperty("customerId");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: componentsQueryKeys.lists() });
  });
});
