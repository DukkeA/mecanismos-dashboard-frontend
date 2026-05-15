"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { backendFetch } from "@/lib/api/backend";
import { BackendRequestError } from "@/lib/api/errors";
import {
  buildCustomerListSearchParams,
  buildCustomerOptionsSearchParams,
  mapCustomer,
  mapCustomerOptions,
  mapCustomersPage,
  toCustomerDto,
  type Customer,
  type CustomerDto,
  type CustomerFormPayload,
  type CustomerListParams,
  type CustomerOptionsParams,
  type CustomersPage,
  type CustomerSearchParams,
} from "@/lib/customers/types";

export const customersQueryKeys = {
  all: ["customers"] as const,
  lists: () => [...customersQueryKeys.all, "list"] as const,
  list: (params: CustomerListParams) =>
    [...customersQueryKeys.lists(), params] as const,
  details: () => [...customersQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...customersQueryKeys.details(), id] as const,
  searches: () => [...customersQueryKeys.all, "search"] as const,
  search: (params: CustomerSearchParams) =>
    [...customersQueryKeys.searches(), params] as const,
  options: () => [...customersQueryKeys.all, "options"] as const,
  optionList: (params: CustomerOptionsParams) =>
    [...customersQueryKeys.options(), params] as const,
};

export { BackendRequestError as CustomerClientError };

export function useCustomersQuery(params: CustomerListParams) {
  return useQuery({
    queryKey: customersQueryKeys.list(params),
    queryFn: async () => {
      const query = buildCustomerListSearchParams(params);
      const response = await backendFetch<unknown>(`/customers?${query}`, {
        refreshOnUnauthorized: true,
      });

      return mapCustomersPage(response as Parameters<typeof mapCustomersPage>[0], params);
    },
    placeholderData: keepPreviousData,
    retryOnMount: false,
  });
}

export function useCustomerQuery(id: string) {
  return useQuery({
    queryKey: customersQueryKeys.detail(id),
    queryFn: async () =>
      mapCustomer(
        await backendFetch<CustomerDto>(`/customers/${id}`, {
          refreshOnUnauthorized: true,
        }),
      ),
    enabled: Boolean(id),
    retryOnMount: false,
  });
}

export function useCustomerSearchQuery(params: CustomerSearchParams) {
  const trimmed = params.search.trim();
  const normalized = { ...params, search: trimmed, limit: params.limit ?? 6 };

  return useQuery({
    queryKey: customersQueryKeys.search(normalized),
    queryFn: async () => {
      const query = buildCustomerOptionsSearchParams(normalized);
      const response = await backendFetch<unknown>(`/customers/options${query ? `?${query}` : ""}`, {
        refreshOnUnauthorized: true,
      });

      return mapCustomerOptions(response as Parameters<typeof mapCustomerOptions>[0]).map(
        (option) =>
          mapCustomer({
            id: option.id,
            name: option.label,
            documentNumber: option.description ?? undefined,
            documentType: option.context?.documentType,
          }),
      );
    },
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
    retryOnMount: false,
  });
}

export function useCustomerOptionsQuery(params: CustomerOptionsParams = {}) {
  const trimmed = params.search?.trim() ?? "";
  const normalized = { ...params, search: trimmed, limit: params.limit ?? 10 };

  return useQuery({
    queryKey: customersQueryKeys.optionList(normalized),
    queryFn: async () => {
      const query = buildCustomerOptionsSearchParams(normalized);
      const response = await backendFetch<unknown>(`/customers/options${query ? `?${query}` : ""}`, {
        refreshOnUnauthorized: true,
      });

      return mapCustomerOptions(response as Parameters<typeof mapCustomerOptions>[0]);
    },
    enabled: params.enabled !== false && (trimmed.length === 0 || trimmed.length >= 2),
    staleTime: 30_000,
    retryOnMount: false,
  });
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CustomerFormPayload) =>
      mapCustomer(
        await backendFetch<CustomerDto>("/customers", {
           method: "POST",
          body: JSON.stringify(toCustomerDto(input)),
          refreshOnUnauthorized: true,
        }),
      ),
    onSuccess: async () => {
      await invalidateCustomerData(queryClient);
      toast.success("Cliente creado.");
    },
    onError: () => {
      toast.error("No pudimos crear el cliente. Revisá los datos e intentá otra vez.");
    },
  });
}

export function useUpdateCustomerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CustomerFormPayload }) =>
      mapCustomer(
        await backendFetch<CustomerDto>(`/customers/${id}`, {
           method: "PATCH",
          body: JSON.stringify(toCustomerDto(input)),
          refreshOnUnauthorized: true,
        }),
      ),
    onSuccess: async (customer) => {
      queryClient.setQueryData(customersQueryKeys.detail(customer.id), customer);
      await invalidateCustomerData(queryClient, customer);
      toast.success("Cliente actualizado.");
    },
    onError: () => {
      toast.error("No pudimos guardar los cambios del cliente.");
    },
  });
}

async function invalidateCustomerData(
  queryClient: ReturnType<typeof useQueryClient>,
  customer?: Customer,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: customersQueryKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: customersQueryKeys.searches() }),
    queryClient.invalidateQueries({ queryKey: customersQueryKeys.options() }),
    customer
      ? queryClient.invalidateQueries({ queryKey: customersQueryKeys.detail(customer.id) })
      : queryClient.invalidateQueries({ queryKey: customersQueryKeys.details() }),
  ]);
}

export type { CustomersPage };
