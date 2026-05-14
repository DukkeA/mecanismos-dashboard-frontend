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
  mapCustomer,
  mapCustomersPage,
  type Customer,
  type CustomerDto,
  type CustomerFormPayload,
  type CustomerListParams,
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
  const listParams: CustomerListParams = {
    page: 1,
    limit: params.limit ?? 6,
    search: trimmed,
    sortBy: params.sortBy ?? "name",
    sortDir: params.sortDir ?? "asc",
  };

  return useQuery({
    queryKey: customersQueryKeys.search({
      search: trimmed,
      limit: listParams.limit,
      sortBy: listParams.sortBy,
      sortDir: listParams.sortDir,
    }),
    queryFn: async () => {
      const query = buildCustomerListSearchParams(listParams);
      const response = await backendFetch<unknown>(`/customers?${query}`, {
        refreshOnUnauthorized: true,
      });

      return mapCustomersPage(
        response as Parameters<typeof mapCustomersPage>[0],
        listParams,
      ).data;
    },
    enabled: trimmed.length >= 2,
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
          body: JSON.stringify(input),
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
          body: JSON.stringify(input),
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
    customer
      ? queryClient.invalidateQueries({ queryKey: customersQueryKeys.detail(customer.id) })
      : queryClient.invalidateQueries({ queryKey: customersQueryKeys.details() }),
  ]);
}

export type { CustomersPage };
