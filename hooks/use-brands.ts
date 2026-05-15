"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { backendFetch } from "@/lib/api/backend";
import {
  buildBrandListSearchParams,
  buildBrandOptionsSearchParams,
  mapBrand,
  mapBrandOptions,
  mapBrandsPage,
  type BrandDto,
  type BrandListParams,
  type BrandOptionsParams,
} from "@/lib/brands/types";

export const brandsQueryKeys = {
  all: ["brands"] as const,
  lists: () => [...brandsQueryKeys.all, "list"] as const,
  list: (params: BrandListParams) => [...brandsQueryKeys.lists(), params] as const,
  details: () => [...brandsQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...brandsQueryKeys.details(), id] as const,
  options: () => [...brandsQueryKeys.all, "options"] as const,
  optionList: (params: BrandOptionsParams) => [...brandsQueryKeys.options(), params] as const,
};

export function useBrandsQuery(params: BrandListParams) {
  return useQuery({
    queryKey: brandsQueryKeys.list(params),
    queryFn: async () => {
      const query = buildBrandListSearchParams(params);
      return mapBrandsPage(
        (await backendFetch<unknown>(`/brands?${query}`, {
          refreshOnUnauthorized: true,
        })) as Parameters<typeof mapBrandsPage>[0],
        params,
      );
    },
    placeholderData: keepPreviousData,
    retryOnMount: false,
  });
}

export function useBrandQuery(id: string) {
  return useQuery({
    queryKey: brandsQueryKeys.detail(id),
    queryFn: async () =>
      mapBrand(
        await backendFetch<BrandDto>(`/brands/${id}`, {
          refreshOnUnauthorized: true,
        }),
      ),
    enabled: Boolean(id),
    retryOnMount: false,
  });
}

export function useBrandOptionsQuery(params: BrandOptionsParams = {}) {
  const trimmed = params.search?.trim() ?? "";
  const normalized = { ...params, search: trimmed, limit: params.limit ?? 10 };

  return useQuery({
    queryKey: brandsQueryKeys.optionList(normalized),
    queryFn: async () => {
      const query = buildBrandOptionsSearchParams(normalized);
      return mapBrandOptions(
        (await backendFetch<unknown>(`/brands/options${query ? `?${query}` : ""}`, {
          refreshOnUnauthorized: true,
        })) as Parameters<typeof mapBrandOptions>[0],
      );
    },
    enabled: trimmed.length === 0 || trimmed.length >= 2,
    staleTime: 60_000,
    retryOnMount: false,
  });
}
