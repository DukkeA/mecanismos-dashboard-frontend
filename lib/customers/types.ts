import { normalizeRichTextNote, type RichTextNote } from "@/lib/rich-text";

export const CUSTOMER_STATUSES = ["active", "inactive"] as const;
export const CUSTOMER_DOCUMENT_TYPES = ["CEDULA", "NIT"] as const;
export const CUSTOMER_SORT_FIELDS = [
  "name",
  "documentNumber",
  "email",
  "phone",
  "createdAt",
  "updatedAt",
] as const;

export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];
export type CustomerDocumentType = (typeof CUSTOMER_DOCUMENT_TYPES)[number];
export type CustomerSortField = (typeof CUSTOMER_SORT_FIELDS)[number];
export type SortDirection = "asc" | "desc";

export type CustomerDto = {
  id: string;
  name?: string | null;
  documentType?: CustomerDocumentType | string | null;
  documentNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: RichTextNote | string;
  isActive?: boolean | null;
  status?: CustomerStatus | string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Customer = {
  id: string;
  name: string;
  documentType: CustomerDocumentType;
  documentNumber: string;
  email: string | null;
  phone: string | null;
  notes: RichTextNote;
  status: CustomerStatus;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CustomerFormPayload = {
  name: string;
  documentType: CustomerDocumentType;
  documentNumber: string;
  email?: string;
  phone: string;
  notes?: RichTextNote;
  status?: CustomerStatus;
};

export type CustomerCreateDto = {
  name: string;
  documentType: CustomerDocumentType;
  documentNumber: string;
  isActive?: boolean;
  email?: string;
  phone: string;
  notes?: RichTextNote;
};

export type CustomerUpdateDto = Partial<CustomerCreateDto>;

export type CustomerListParams = {
  page: number;
  limit: number;
  search?: string;
  status?: CustomerStatus | "all";
  isActive?: boolean;
  sortBy?: CustomerSortField;
  sortDir?: SortDirection;
};

export type CustomerSearchParams = {
  search: string;
  limit?: number;
  documentType?: CustomerDocumentType;
  isActive?: boolean;
};

export type CustomerOptionsParams = {
  search?: string;
  limit?: number;
  documentType?: CustomerDocumentType;
  isActive?: boolean;
  enabled?: boolean;
};

export type CustomerOption = {
  id: string;
  label: string;
  description: string | null;
  context?: { documentType?: CustomerDocumentType | string; documentNumber?: string };
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
  documentType: "NIT",
  documentNumber: "Sin documento",
  email: null,
  phone: null,
  notes: null,
  status: "active",
  createdAt: null,
  updatedAt: null,
};

export function mapCustomer(dto: CustomerDto): Customer {
  const status = dto.isActive === false || dto.status === "inactive" ? "inactive" : "active";
  const documentType = CUSTOMER_DOCUMENT_TYPES.includes(dto.documentType as CustomerDocumentType)
    ? (dto.documentType as CustomerDocumentType)
    : fallbackCustomer.documentType;

  return {
    ...fallbackCustomer,
    id: String(dto.id || fallbackCustomer.id),
    name: dto.name?.trim() || fallbackCustomer.name,
    documentType,
    documentNumber: dto.documentNumber?.trim() || fallbackCustomer.documentNumber,
    email: dto.email?.trim() || null,
    phone: dto.phone?.trim() || null,
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
  if (typeof params.isActive === "boolean") {
    query.set("isActive", String(params.isActive));
  } else if (params.status && params.status !== "all") {
    query.set("isActive", String(params.status === "active"));
  }
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDir) query.set("sortDir", params.sortDir);

  return query.toString();
}

export function buildCustomerOptionsSearchParams(params: CustomerOptionsParams = {}) {
  const query = new URLSearchParams();

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.limit) query.set("limit", String(params.limit));
  if (params.documentType) query.set("documentType", params.documentType);
  if (typeof params.isActive === "boolean") query.set("isActive", String(params.isActive));

  return query.toString();
}

export function mapCustomerOptions(response: { data?: CustomerOption[] } | CustomerOption[]) {
  const options = Array.isArray(response) ? response : response.data ?? [];

  return options.map((option) => ({
    id: String(option.id),
    label: option.label?.trim() || getStringOptionField(option, "name") || "Cliente sin nombre",
    description:
      option.description?.trim() || getStringOptionField(option, "documentNumber") || null,
    context: option.context,
  }));
}

function getStringOptionField(option: CustomerOption, field: string) {
  const value = (option as unknown as Record<string, unknown>)[field];
  return typeof value === "string" ? value.trim() : "";
}

export function toCustomerDto(input: CustomerFormPayload): CustomerCreateDto {
  return stripUndefined({
    name: input.name,
    documentType: input.documentType,
    documentNumber: input.documentNumber,
    isActive: (input.status ?? "active") === "active",
    email: input.email,
    phone: input.phone,
    notes: input.notes,
  });
}

function stripUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}
