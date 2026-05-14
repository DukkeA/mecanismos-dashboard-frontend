"use client";

import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { VehicleFormDialog } from "@/features/vehicles/vehicle-form-dialog";
import type { VehicleListParams } from "@/lib/vehicles/types";

export function VehiclesToolbar({
  params,
  onParamsChange,
}: {
  params: VehicleListParams;
  onParamsChange: (params: VehicleListParams) => void;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <form role="search" onSubmit={(event) => event.preventDefault()} className="w-full sm:w-96">
        <Label htmlFor="vehicles-search" className="sr-only">Buscar vehículos</Label>
        <InputGroup className="h-9 bg-background">
          <InputGroupAddon><SearchIcon aria-hidden="true" /></InputGroupAddon>
          <InputGroupInput id="vehicles-search" type="search" value={params.search ?? ""} placeholder="Buscar por patente, marca o modelo" onChange={(event) => onParamsChange({ ...params, search: event.target.value, page: 1 })} />
        </InputGroup>
      </form>
      <VehicleFormDialog trigger={<Button type="button">Nuevo vehículo</Button>} />
    </div>
  );
}
