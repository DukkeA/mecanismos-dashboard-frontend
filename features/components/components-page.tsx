"use client";

import { useState } from "react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComponentsTable } from "@/features/components/components-table";
import { ComponentsToolbar } from "@/features/components/components-toolbar";
import { useComponentsQuery } from "@/hooks/use-components";
import type { ComponentListParams } from "@/lib/components/types";

const initialParams: ComponentListParams = { page: 1, limit: 10, search: "" };

export function ComponentsPage() {
  const [params, setParams] = useState(initialParams);
  const query = useComponentsQuery(params);
  return <main className="flex flex-1 flex-col gap-6 p-4 md:p-6"><Card className="border-dashed bg-card/60"><CardHeader><CardTitle className="text-2xl">Componentes</CardTitle><CardDescription>Buscá repuestos y componentes por contrato backend, sin parámetros de ordenamiento no soportados.</CardDescription></CardHeader></Card><ComponentsToolbar params={params} onParamsChange={setParams} /><ComponentsTable params={params} page={query.data} isPending={query.isPending} isError={query.isError} onRetry={() => void query.refetch()} onParamsChange={setParams} /></main>;
}
