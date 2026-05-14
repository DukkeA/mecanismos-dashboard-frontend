"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaginationMeta } from "@/lib/customers/types";

export function AssetPagination<TParams extends { page: number; limit: number }>({
  label,
  params,
  meta,
  onParamsChange,
}: {
  label: string;
  params: TParams;
  meta: PaginationMeta;
  onParamsChange: (params: TParams) => void;
}) {
  const canPrevious = meta.page > 1;
  const canNext = meta.page < meta.totalPages;

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {meta.total} {label}{meta.total === 1 ? "" : "s"} · Página {meta.page} de {meta.totalPages}
      </p>
      <div className="flex items-center gap-3">
        <Select
          value={String(params.limit)}
          onValueChange={(value) => onParamsChange({ ...params, limit: Number(value), page: 1 })}
        >
          <SelectTrigger aria-label="Filas por página" className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {[10, 20, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Pagination className="w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text="Anterior"
                aria-disabled={!canPrevious}
                onClick={(event) => {
                  event.preventDefault();
                  if (canPrevious) onParamsChange({ ...params, page: params.page - 1 });
                }}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                text="Siguiente"
                aria-disabled={!canNext}
                onClick={(event) => {
                  event.preventDefault();
                  if (canNext) onParamsChange({ ...params, page: params.page + 1 });
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
