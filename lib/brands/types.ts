import type { PaginationMeta } from "@/lib/customers/types";
import type { ReferenceOption } from "@/lib/vehicles/types";

export type BrandDto = {
  id: string;
  name?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Brand = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type BrandListParams = {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
};

export type BrandOptionsParams = {
  search?: string;
  limit?: number;
  isActive?: boolean;
};

export type BrandsPage = {
  data: Brand[];
  meta: PaginationMeta;
};

type BackendListResponse = {
  data?: BrandDto[];
  meta?: Partial<PaginationMeta>;
};

type BackendOptionsResponse = {
  data?: ReferenceOption<{ isActive?: boolean }>[];
};

export function mapBrand(dto: BrandDto): Brand {
  return {
    id: String(dto.id),
    name: dto.name?.trim() || "Marca sin nombre",
    isActive: dto.isActive !== false,
    createdAt: dto.createdAt || null,
    updatedAt: dto.updatedAt || null,
  };
}

export function mapBrandsPage(
  response: BackendListResponse | BrandDto[],
  params: BrandListParams,
): BrandsPage {
  const list = Array.isArray(response) ? response : response.data ?? [];
  const meta = Array.isArray(response) ? {} : response.meta ?? {};
  const total = Number(meta.total ?? list.length);
  const limit = Number(meta.limit ?? params.limit);

  return {
    data: list.map(mapBrand),
    meta: {
      page: Number(meta.page ?? params.page),
      limit,
      total,
      totalPages: Number(meta.totalPages ?? Math.max(1, Math.ceil(total / limit))),
    },
  };
}

export function mapBrandOptions(
  response: BackendOptionsResponse | ReferenceOption<{ isActive?: boolean }>[],
) {
  const options = Array.isArray(response) ? response : response.data ?? [];

  return options.map((option) => ({
    id: String(option.id),
    label: option.label?.trim() || "Marca sin nombre",
    description: option.description?.trim() || null,
    context: option.context,
  }));
}

export function buildBrandListSearchParams(params: BrandListParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (typeof params.isActive === "boolean") query.set("isActive", String(params.isActive));

  return query.toString();
}

export function buildBrandOptionsSearchParams(params: BrandOptionsParams = {}) {
  const query = new URLSearchParams();

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.limit) query.set("limit", String(params.limit));
  if (typeof params.isActive === "boolean") query.set("isActive", String(params.isActive));

  return query.toString();
}
