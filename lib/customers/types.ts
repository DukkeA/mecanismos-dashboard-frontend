import { normalizeRichTextNote, type RichTextNote } from "@/lib/rich-text";

export const CUSTOMER_STATUSES = ["active", "inactive"] as const;
export const CUSTOMER_SORT_FIELDS = [
  "name",
  "documentNumber",
  "email",
  "phone",
  "status",
  "createdAt",
] as const;

export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];
export type CustomerSortField = (typeof CUSTOMER_SORT_FIELDS)[number];
export type SortDirection = "asc" | "desc";

export type CustomerDto = {
  id: string;
  name?: string | null;
  documentNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: RichTextNote | string;
  status?: CustomerStatus | string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Customer = {
  id: string;
  name: string;
  documentNumber: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: RichTextNote;
  status: CustomerStatus;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CustomerFormPayload = {
  name: string;
  documentNumber: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: RichTextNote;
  status?: CustomerStatus;
};

export type CustomerListParams = {
  page: number;
  limit: number;
  search?: string;
  status?: CustomerStatus | "all";
  sortBy?: CustomerSortField;
  sortDir?: SortDirection;
};

export type CustomerSearchParams = {
  search: string;
  limit?: number;
  sortBy?: CustomerSortField;
  sortDir?: SortDirection;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CustomersPage = {
  data: Customer[];
  meta: PaginationMeta;
};

type BackendListResponse = {
  data?: CustomerDto[];
  items?: CustomerDto[];
  customers?: CustomerDto[];
  meta?: Partial<PaginationMeta>;
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

const fallbackCustomer: Customer = {
  id: "unknown",
  name: "Cliente sin nombre",
  documentNumber: "Sin documento",
  email: null,
  phone: null,
  address: null,
  notes: null,
  status: "active",
  createdAt: null,
  updatedAt: null,
};

export function mapCustomer(dto: CustomerDto): Customer {
  const status = dto.status === "inactive" ? "inactive" : "active";

  return {
    ...fallbackCustomer,
    id: String(dto.id || fallbackCustomer.id),
    name: dto.name?.trim() || fallbackCustomer.name,
    documentNumber: dto.documentNumber?.trim() || fallbackCustomer.documentNumber,
    email: dto.email?.trim() || null,
    phone: dto.phone?.trim() || null,
    address: dto.address?.trim() || null,
    notes: normalizeRichTextNote(dto.notes),
    status,
    createdAt: dto.createdAt || null,
    updatedAt: dto.updatedAt || null,
  };
}

export function mapCustomersPage(
  response: BackendListResponse | CustomerDto[],
  params: CustomerListParams,
): CustomersPage {
  const list = Array.isArray(response)
    ? response
    : response.data ?? response.items ?? response.customers ?? [];
  const meta = Array.isArray(response) ? {} : response.meta ?? response;
  const total = Number(meta.total ?? list.length);
  const limit = Number(meta.limit ?? params.limit);

  return {
    data: list.map(mapCustomer),
    meta: {
      page: Number(meta.page ?? params.page),
      limit,
      total,
      totalPages: Number(meta.totalPages ?? Math.max(1, Math.ceil(total / limit))),
    },
  };
}

export function buildCustomerListSearchParams(params: CustomerListParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDir) query.set("sortDir", params.sortDir);

  return query.toString();
}
