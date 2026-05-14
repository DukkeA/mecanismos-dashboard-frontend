import type { PaginationMeta } from "@/lib/customers/types";
import type { ComponentType, ComponentTypeDto } from "@/lib/component-types/types";
import { mapComponentType } from "@/lib/component-types/types";
import type { ReferenceOption } from "@/lib/vehicles/types";

export type ComponentDto = {
  id: string;
  customerId: string;
  vehicleId?: string | null;
  componentTypeId: string;
  brand?: string | null;
  reference?: string | null;
  identifier?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  componentType?: ComponentTypeDto | null;
};

export type WorkshopComponent = {
  id: string;
  customerId: string;
  vehicleId: string | null;
  componentTypeId: string;
  brand: string;
  reference: string;
  identifier: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  componentType: ComponentType | null;
};

export type ComponentFormPayload = {
  customerId: string;
  componentTypeId: string;
  vehicleId?: string | null;
  brand: string;
  reference: string;
  identifier?: string;
  notes?: string;
};

export type ComponentUpdatePayload = Omit<ComponentFormPayload, "customerId">;

export type ComponentListParams = {
  page: number;
  limit: number;
  search?: string;
  customerId?: string;
  vehicleId?: string;
  componentTypeId?: string;
};

export type ComponentOptionsParams = Omit<ComponentListParams, "page">;

export type ComponentsPage = {
  data: WorkshopComponent[];
  meta: PaginationMeta;
};

export type ComponentOptionContext = {
  customerId?: string;
  vehicleId?: string | null;
  componentTypeId?: string;
  componentTypeName?: string;
};

type BackendListResponse = {
  data?: ComponentDto[];
  meta?: Partial<PaginationMeta>;
};

type BackendOptionsResponse = {
  data?: ReferenceOption<ComponentOptionContext>[];
};

export function mapComponent(dto: ComponentDto): WorkshopComponent {
  return {
    id: String(dto.id),
    customerId: String(dto.customerId),
    vehicleId: dto.vehicleId ? String(dto.vehicleId) : null,
    componentTypeId: String(dto.componentTypeId),
    brand: dto.brand?.trim() || "Sin marca",
    reference: dto.reference?.trim() || "Sin referencia",
    identifier: dto.identifier?.trim() || null,
    notes: dto.notes?.trim() || null,
    createdAt: dto.createdAt || null,
    updatedAt: dto.updatedAt || null,
    componentType: dto.componentType ? mapComponentType(dto.componentType) : null,
  };
}

export function mapComponentsPage(
  response: BackendListResponse | ComponentDto[],
  params: ComponentListParams,
): ComponentsPage {
  const list = Array.isArray(response) ? response : response.data ?? [];
  const meta = Array.isArray(response) ? {} : response.meta ?? {};
  const total = Number(meta.total ?? list.length);
  const limit = Number(meta.limit ?? params.limit);

  return {
    data: list.map(mapComponent),
    meta: {
      page: Number(meta.page ?? params.page),
      limit,
      total,
      totalPages: Number(meta.totalPages ?? Math.max(1, Math.ceil(total / limit))),
    },
  };
}

export function mapComponentOptions(
  response: BackendOptionsResponse | ReferenceOption<ComponentOptionContext>[],
) {
  const options = Array.isArray(response) ? response : response.data ?? [];

  return options.map((option) => ({
    id: String(option.id),
    label: option.label?.trim() || "Componente sin identificador",
    description: option.description?.trim() || null,
    context: option.context,
  }));
}

export function buildComponentListSearchParams(params: ComponentListParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  appendComponentFilters(query, params);

  return query.toString();
}

export function buildComponentOptionsSearchParams(params: ComponentOptionsParams = { limit: 10 }) {
  const query = new URLSearchParams();

  if (params.limit) query.set("limit", String(params.limit));
  appendComponentFilters(query, params);

  return query.toString();
}

function appendComponentFilters(
  query: URLSearchParams,
  params: Partial<ComponentListParams>,
) {
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.customerId?.trim()) query.set("customerId", params.customerId.trim());
  if (params.vehicleId?.trim()) query.set("vehicleId", params.vehicleId.trim());
  if (params.componentTypeId?.trim()) {
    query.set("componentTypeId", params.componentTypeId.trim());
  }
}
