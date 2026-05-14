"use client";

import { useState } from "react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VehiclesTable } from "@/features/vehicles/vehicles-table";
import { VehiclesToolbar } from "@/features/vehicles/vehicles-toolbar";
import { useVehiclesQuery } from "@/hooks/use-vehicles";
import type { VehicleListParams } from "@/lib/vehicles/types";

const initialParams: VehicleListParams = { page: 1, limit: 10, search: "" };

export function VehiclesPage() {
  const [params, setParams] = useState(initialParams);
  const query = useVehiclesQuery(params);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="border-dashed bg-card/60">
        <CardHeader>
          <CardTitle className="text-2xl">Vehículos</CardTitle>
          <CardDescription>Buscá y mantené los vehículos asociados a clientes sin ordenar con parámetros no soportados.</CardDescription>
        </CardHeader>
      </Card>
      <VehiclesToolbar params={params} onParamsChange={setParams} />
      <VehiclesTable params={params} page={query.data} isPending={query.isPending} isError={query.isError} onRetry={() => void query.refetch()} onParamsChange={setParams} />
    </main>
  );
}
