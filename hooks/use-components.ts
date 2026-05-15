"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { brandsQueryKeys } from "@/hooks/use-brands";
import { componentTypesQueryKeys } from "@/hooks/use-component-types";
import { customersQueryKeys } from "@/hooks/use-customers";
import { vehiclesQueryKeys } from "@/hooks/use-vehicles";
import { backendFetch } from "@/lib/api/backend";
import { BackendRequestError } from "@/lib/api/errors";
import {
  buildComponentListSearchParams,
  buildComponentOptionsSearchParams,
  mapComponent,
  mapComponentOptions,
  mapComponentsPage,
  type ComponentDto,
  type ComponentFormPayload,
  type ComponentListParams,
  type ComponentOptionsParams,
  type ComponentUpdatePayload,
  type ComponentsPage,
  type WorkshopComponent,
} from "@/lib/components/types";

export const componentsQueryKeys = {
  all: ["components"] as const,
  lists: () => [...componentsQueryKeys.all, "list"] as const,
  list: (params: ComponentListParams) => [...componentsQueryKeys.lists(), params] as const,
  details: () => [...componentsQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...componentsQueryKeys.details(), id] as const,
  options: () => [...componentsQueryKeys.all, "options"] as const,
  optionList: (params: ComponentOptionsParams) => [...componentsQueryKeys.options(), params] as const,
};

export { BackendRequestError as ComponentClientError };

export function useComponentsQuery(params: ComponentListParams) {
  return useQuery({
    queryKey: componentsQueryKeys.list(params),
    queryFn: async () => {
      const query = buildComponentListSearchParams(params);
      return mapComponentsPage(
        (await backendFetch<unknown>(`/components?${query}`, {
          refreshOnUnauthorized: true,
        })) as Parameters<typeof mapComponentsPage>[0],
        params,
      );
    },
    placeholderData: keepPreviousData,
    retryOnMount: false,
  });
}

export function useComponentQuery(id: string) {
  return useQuery({
    queryKey: componentsQueryKeys.detail(id),
    queryFn: async () =>
      mapComponent(
        await backendFetch<ComponentDto>(`/components/${id}`, { refreshOnUnauthorized: true }),
      ),
    enabled: Boolean(id),
    retryOnMount: false,
  });
}

export function useComponentOptionsQuery(params: ComponentOptionsParams) {
  const trimmed = params.search?.trim() ?? "";
  const normalized = { ...params, search: trimmed, limit: params.limit ?? 10 };

  return useQuery({
    queryKey: componentsQueryKeys.optionList(normalized),
    queryFn: async () => {
      const query = buildComponentOptionsSearchParams(normalized);
      return mapComponentOptions(
        (await backendFetch<unknown>(`/components/options${query ? `?${query}` : ""}`, {
          refreshOnUnauthorized: true,
        })) as Parameters<typeof mapComponentOptions>[0],
      );
    },
    enabled: trimmed.length === 0 || trimmed.length >= 2,
    staleTime: 30_000,
    retryOnMount: false,
  });
}

export function useCreateComponentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ComponentFormPayload) =>
      mapComponent(
        await backendFetch<ComponentDto>("/components", {
          method: "POST",
          body: JSON.stringify(input),
          refreshOnUnauthorized: true,
        }),
      ),
    onSuccess: async (component) => {
      await invalidateComponentData(queryClient, component);
      toast.success("Componente creado.");
    },
    onError: () => {
      toast.error("No pudimos crear el componente. Revisá los datos e intentá otra vez.");
    },
  });
}

export function useUpdateComponentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ComponentUpdatePayload }) =>
      mapComponent(
        await backendFetch<ComponentDto>(`/components/${id}`, {
          method: "PATCH",
          body: JSON.stringify(input),
          refreshOnUnauthorized: true,
        }),
      ),
    onSuccess: async (component) => {
      queryClient.setQueryData(componentsQueryKeys.detail(component.id), component);
      await invalidateComponentData(queryClient, component);
      toast.success("Componente actualizado.");
    },
    onError: () => {
      toast.error("No pudimos guardar los cambios del componente.");
    },
  });
}

async function invalidateComponentData(
  queryClient: ReturnType<typeof useQueryClient>,
  component?: WorkshopComponent,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: componentsQueryKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: componentsQueryKeys.options() }),
    queryClient.invalidateQueries({ queryKey: brandsQueryKeys.options() }),
    queryClient.invalidateQueries({ queryKey: componentTypesQueryKeys.options() }),
    component
      ? queryClient.invalidateQueries({ queryKey: componentsQueryKeys.detail(component.id) })
      : queryClient.invalidateQueries({ queryKey: componentsQueryKeys.details() }),
    component
      ? queryClient.invalidateQueries({ queryKey: customersQueryKeys.detail(component.customerId) })
      : queryClient.invalidateQueries({ queryKey: customersQueryKeys.details() }),
    component?.vehicleId
      ? queryClient.invalidateQueries({ queryKey: vehiclesQueryKeys.detail(component.vehicleId) })
      : queryClient.invalidateQueries({ queryKey: vehiclesQueryKeys.details() }),
  ]);
}

export type { ComponentsPage };
