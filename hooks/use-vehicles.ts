"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { customersQueryKeys } from "@/hooks/use-customers";
import { backendFetch } from "@/lib/api/backend";
import { BackendRequestError } from "@/lib/api/errors";
import {
  buildVehicleListSearchParams,
  buildVehicleOptionsSearchParams,
  mapVehicle,
  mapVehicleOptions,
  mapVehiclesPage,
  type Vehicle,
  type VehicleDto,
  type VehicleFormPayload,
  type VehicleListParams,
  type VehicleOptionsParams,
  type VehiclesPage,
  type VehicleUpdatePayload,
} from "@/lib/vehicles/types";

export const vehiclesQueryKeys = {
  all: ["vehicles"] as const,
  lists: () => [...vehiclesQueryKeys.all, "list"] as const,
  list: (params: VehicleListParams) => [...vehiclesQueryKeys.lists(), params] as const,
  details: () => [...vehiclesQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...vehiclesQueryKeys.details(), id] as const,
  options: () => [...vehiclesQueryKeys.all, "options"] as const,
  optionList: (params: VehicleOptionsParams) => [...vehiclesQueryKeys.options(), params] as const,
};

export { BackendRequestError as VehicleClientError };

export function useVehiclesQuery(params: VehicleListParams) {
  return useQuery({
    queryKey: vehiclesQueryKeys.list(params),
    queryFn: async () => {
      const query = buildVehicleListSearchParams(params);
      const response = await backendFetch<unknown>(`/vehicles?${query}`, {
        refreshOnUnauthorized: true,
      });

      return mapVehiclesPage(response as Parameters<typeof mapVehiclesPage>[0], params);
    },
    placeholderData: keepPreviousData,
    retryOnMount: false,
  });
}

export function useVehicleQuery(id: string) {
  return useQuery({
    queryKey: vehiclesQueryKeys.detail(id),
    queryFn: async () =>
      mapVehicle(
        await backendFetch<VehicleDto>(`/vehicles/${id}`, { refreshOnUnauthorized: true }),
      ),
    enabled: Boolean(id),
    retryOnMount: false,
  });
}

export function useVehicleOptionsQuery(params: VehicleOptionsParams) {
  const trimmed = params.search?.trim() ?? "";
  const normalized = { ...params, search: trimmed, limit: params.limit ?? 10 };

  return useQuery({
    queryKey: vehiclesQueryKeys.optionList(normalized),
    queryFn: async () => {
      const query = buildVehicleOptionsSearchParams(normalized);
      return mapVehicleOptions(
        (await backendFetch<unknown>(`/vehicles/options${query ? `?${query}` : ""}`, {
          refreshOnUnauthorized: true,
        })) as Parameters<typeof mapVehicleOptions>[0],
      );
    },
    enabled: trimmed.length === 0 || trimmed.length >= 2,
    staleTime: 30_000,
    retryOnMount: false,
  });
}

export function useCreateVehicleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: VehicleFormPayload) =>
      mapVehicle(
        await backendFetch<VehicleDto>("/vehicles", {
          method: "POST",
          body: JSON.stringify(input),
          refreshOnUnauthorized: true,
        }),
      ),
    onSuccess: async (vehicle) => {
      await invalidateVehicleData(queryClient, vehicle);
      toast.success("Vehículo creado.");
    },
    onError: () => {
      toast.error("No pudimos crear el vehículo. Revisá los datos e intentá otra vez.");
    },
  });
}

export function useUpdateVehicleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: VehicleUpdatePayload }) =>
      mapVehicle(
        await backendFetch<VehicleDto>(`/vehicles/${id}`, {
          method: "PATCH",
          body: JSON.stringify(input),
          refreshOnUnauthorized: true,
        }),
      ),
    onSuccess: async (vehicle) => {
      queryClient.setQueryData(vehiclesQueryKeys.detail(vehicle.id), vehicle);
      await invalidateVehicleData(queryClient, vehicle);
      toast.success("Vehículo actualizado.");
    },
    onError: () => {
      toast.error("No pudimos guardar los cambios del vehículo.");
    },
  });
}

async function invalidateVehicleData(
  queryClient: ReturnType<typeof useQueryClient>,
  vehicle?: Vehicle,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: vehiclesQueryKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: vehiclesQueryKeys.options() }),
    vehicle
      ? queryClient.invalidateQueries({ queryKey: vehiclesQueryKeys.detail(vehicle.id) })
      : queryClient.invalidateQueries({ queryKey: vehiclesQueryKeys.details() }),
    vehicle
      ? queryClient.invalidateQueries({ queryKey: customersQueryKeys.detail(vehicle.customerId) })
      : queryClient.invalidateQueries({ queryKey: customersQueryKeys.details() }),
  ]);
}

export type { VehiclesPage };
