import type { PaginationMeta } from "@/lib/customers/types";
import type { CustomerDocumentType } from "@/lib/customers/types";
import { normalizeRichTextNote, type RichTextNote } from "@/lib/rich-text";

export type ReferenceOption<Context = Record<string, unknown>> = {
  id: string;
  label: string;
  description: string | null;
  context?: Context;
};

export type VehicleDto = {
  id: string;
  customerId: string;
  brand?: string | null;
  modelReference?: string | null;
  plate?: string | null;
  notes?: RichTextNote | string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Vehicle = {
  id: string;
  customerId: string;
  brand: string;
  modelReference: string;
  plate: string;
  notes: RichTextNote;
  createdAt: string | null;
  updatedAt: string | null;
};

export type VehicleFormPayload = {
  customerId?: string;
  customer?: {
    name: string;
    phone: string;
    documentType: CustomerDocumentType;
    documentNumber: string;
    email?: string;
    notes?: RichTextNote;
    isActive?: boolean;
  };
  brandId?: string;
  brand?: string | { name: string };
  brandName?: string;
  modelReference: string;
  plate: string;
  notes?: RichTextNote;
};

export type VehicleUpdatePayload = Omit<VehicleFormPayload, "customerId" | "customer">;

export type VehicleListParams = {
  page: number;
  limit: number;
  search?: string;
  customerId?: string;
};

export type VehicleOptionsParams = {
  search?: string;
  limit?: number;
  customerId?: string;
};

export type VehiclesPage = {
  data: Vehicle[];
  meta: PaginationMeta;
};

export type VehicleOptionContext = {
  customerId?: string;
  brand?: string;
  modelReference?: string;
};

type BackendListResponse = {
  data?: VehicleDto[];
  meta?: Partial<PaginationMeta>;
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

type BackendOptionsResponse = {
  data?: ReferenceOption<VehicleOptionContext>[];
  meta?: { limit?: number };
};

export function mapVehicle(dto: VehicleDto): Vehicle {
  return {
    id: String(dto.id),
    customerId: String(dto.customerId),
    brand: dto.brand?.trim() || "Sin marca",
    modelReference: dto.modelReference?.trim() || "Sin modelo",
    plate: dto.plate?.trim() || "Sin placa",
    notes: normalizeRichTextNote(dto.notes),
    createdAt: dto.createdAt || null,
    updatedAt: dto.updatedAt || null,
  };
}

export function mapVehiclesPage(
  response: BackendListResponse | VehicleDto[],
  params: VehicleListParams,
): VehiclesPage {
  const list = Array.isArray(response) ? response : response.data ?? [];
  const meta = Array.isArray(response) ? {} : response.meta ?? response;
  const total = Number(meta.total ?? list.length);
  const limit = Number(meta.limit ?? params.limit);

  return {
    data: list.map(mapVehicle),
    meta: {
      page: Number(meta.page ?? params.page),
      limit,
      total,
      totalPages: Number(meta.totalPages ?? Math.max(1, Math.ceil(total / limit))),
    },
  };
}

export function mapVehicleOptions(
  response: BackendOptionsResponse | ReferenceOption<VehicleOptionContext>[],
) {
  const options = Array.isArray(response) ? response : response.data ?? [];

  return options.map((option) => ({
    id: String(option.id),
    label: option.label?.trim() || "Vehículo sin placa",
    description: option.description?.trim() || null,
    context: option.context,
  }));
}

export function buildVehicleListSearchParams(params: VehicleListParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.customerId?.trim()) query.set("customerId", params.customerId.trim());

  return query.toString();
}

export function buildVehicleOptionsSearchParams(params: VehicleOptionsParams = {}) {
  const query = new URLSearchParams();

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.limit) query.set("limit", String(params.limit));
  if (params.customerId?.trim()) query.set("customerId", params.customerId.trim());

  return query.toString();
}
