import type { PaginationMeta } from "@/lib/customers/types";
import type { ReferenceOption } from "@/lib/vehicles/types";

export type ComponentTypeDto = {
  id: string;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ComponentType = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ComponentTypeListParams = {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
};

export type ComponentTypeOptionsParams = {
  search?: string;
  limit?: number;
  isActive?: boolean;
};

export type ComponentTypesPage = {
  data: ComponentType[];
  meta: PaginationMeta;
};

type BackendListResponse = {
  data?: ComponentTypeDto[];
  meta?: Partial<PaginationMeta>;
};

type BackendOptionsResponse = {
  data?: ReferenceOption<{ isActive?: boolean }>[];
};

export function mapComponentType(dto: ComponentTypeDto): ComponentType {
  return {
    id: String(dto.id),
    name: dto.name?.trim() || "Tipo sin nombre",
    slug: dto.slug?.trim() || null,
    description: dto.description?.trim() || null,
    isActive: dto.isActive !== false,
    createdAt: dto.createdAt || null,
    updatedAt: dto.updatedAt || null,
  };
}

export function mapComponentTypesPage(
  response: BackendListResponse | ComponentTypeDto[],
  params: ComponentTypeListParams,
): ComponentTypesPage {
  const list = Array.isArray(response) ? response : response.data ?? [];
  const meta = Array.isArray(response) ? {} : response.meta ?? {};
  const total = Number(meta.total ?? list.length);
  const limit = Number(meta.limit ?? params.limit);

  return {
    data: list.map(mapComponentType),
    meta: {
      page: Number(meta.page ?? params.page),
      limit,
      total,
      totalPages: Number(meta.totalPages ?? Math.max(1, Math.ceil(total / limit))),
    },
  };
}

export function mapComponentTypeOptions(
  response: BackendOptionsResponse | ReferenceOption<{ isActive?: boolean }>[],
) {
  const options = Array.isArray(response) ? response : response.data ?? [];

  return options.map((option) => ({
    id: String(option.id),
    label: option.label?.trim() || "Tipo sin nombre",
    description: option.description?.trim() || null,
    context: option.context,
  }));
}

export function buildComponentTypeListSearchParams(params: ComponentTypeListParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (typeof params.isActive === "boolean") query.set("isActive", String(params.isActive));

  return query.toString();
}

export function buildComponentTypeOptionsSearchParams(
  params: ComponentTypeOptionsParams = {},
) {
  const query = new URLSearchParams();

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.limit) query.set("limit", String(params.limit));
  if (typeof params.isActive === "boolean") query.set("isActive", String(params.isActive));

  return query.toString();
}
