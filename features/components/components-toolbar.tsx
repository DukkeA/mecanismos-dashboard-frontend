"use client";

import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComponentFormDialog } from "@/features/components/component-form-dialog";
import { useComponentTypeOptionsQuery } from "@/hooks/use-component-types";
import type { ComponentListParams } from "@/lib/components/types";

const ALL_TYPES = "all";

export function ComponentsToolbar({ params, onParamsChange }: { params: ComponentListParams; onParamsChange: (params: ComponentListParams) => void }) {
  const typesQuery = useComponentTypeOptionsQuery({ isActive: true, limit: 50 });
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form role="search" onSubmit={(event) => event.preventDefault()} className="w-full sm:w-96">
          <Label htmlFor="components-search" className="sr-only">Buscar componentes</Label>
          <InputGroup className="h-9 bg-background"><InputGroupAddon><SearchIcon aria-hidden="true" /></InputGroupAddon><InputGroupInput id="components-search" type="search" value={params.search ?? ""} placeholder="Buscar por identificador, referencia o marca" onChange={(event) => onParamsChange({ ...params, search: event.target.value, page: 1 })} /></InputGroup>
        </form>
        <Select value={params.componentTypeId ?? ALL_TYPES} onValueChange={(value) => onParamsChange({ ...params, componentTypeId: value === ALL_TYPES ? undefined : value, page: 1 })}>
          <SelectTrigger aria-label="Filtrar por tipo" className="w-full sm:w-56"><SelectValue placeholder={typesQuery.isPending ? "Cargando tipos" : "Tipo"} /></SelectTrigger>
          <SelectContent><SelectGroup><SelectItem value={ALL_TYPES}>Todos los tipos</SelectItem>{(typesQuery.data ?? []).map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}</SelectGroup></SelectContent>
        </Select>
      </div>
      <ComponentFormDialog trigger={<Button type="button">Nuevo componente</Button>} />
    </div>
  );
}
