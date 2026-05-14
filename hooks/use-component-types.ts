"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { backendFetch } from "@/lib/api/backend";
import {
  buildComponentTypeListSearchParams,
  buildComponentTypeOptionsSearchParams,
  mapComponentType,
  mapComponentTypeOptions,
  mapComponentTypesPage,
  type ComponentTypeDto,
  type ComponentTypeListParams,
  type ComponentTypeOptionsParams,
} from "@/lib/component-types/types";

export const componentTypesQueryKeys = {
  all: ["component-types"] as const,
  lists: () => [...componentTypesQueryKeys.all, "list"] as const,
  list: (params: ComponentTypeListParams) => [...componentTypesQueryKeys.lists(), params] as const,
  details: () => [...componentTypesQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...componentTypesQueryKeys.details(), id] as const,
  options: () => [...componentTypesQueryKeys.all, "options"] as const,
  optionList: (params: ComponentTypeOptionsParams) => [...componentTypesQueryKeys.options(), params] as const,
};

export function useComponentTypesQuery(params: ComponentTypeListParams) {
  return useQuery({
    queryKey: componentTypesQueryKeys.list(params),
    queryFn: async () => {
      const query = buildComponentTypeListSearchParams(params);
      return mapComponentTypesPage(
        (await backendFetch<unknown>(`/component-types?${query}`, {
          refreshOnUnauthorized: true,
        })) as Parameters<typeof mapComponentTypesPage>[0],
        params,
      );
    },
    placeholderData: keepPreviousData,
    retryOnMount: false,
  });
}

export function useComponentTypeQuery(id: string) {
  return useQuery({
    queryKey: componentTypesQueryKeys.detail(id),
    queryFn: async () =>
      mapComponentType(
        await backendFetch<ComponentTypeDto>(`/component-types/${id}`, {
          refreshOnUnauthorized: true,
        }),
      ),
    enabled: Boolean(id),
    retryOnMount: false,
  });
}

export function useComponentTypeOptionsQuery(params: ComponentTypeOptionsParams = {}) {
  const trimmed = params.search?.trim() ?? "";
  const normalized = { ...params, search: trimmed, limit: params.limit ?? 10 };

  return useQuery({
    queryKey: componentTypesQueryKeys.optionList(normalized),
    queryFn: async () => {
      const query = buildComponentTypeOptionsSearchParams(normalized);
      return mapComponentTypeOptions(
        (await backendFetch<unknown>(`/component-types/options${query ? `?${query}` : ""}`, {
          refreshOnUnauthorized: true,
        })) as Parameters<typeof mapComponentTypeOptions>[0],
      );
    },
    enabled: trimmed.length === 0 || trimmed.length >= 2,
    staleTime: 60_000,
    retryOnMount: false,
  });
}
