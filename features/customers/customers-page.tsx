"use client";

import { useState } from "react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomersTable } from "@/features/customers/customers-table";
import { CustomersToolbar } from "@/features/customers/customers-toolbar";
import { useCustomersQuery } from "@/hooks/use-customers";
import type { CustomerListParams } from "@/lib/customers/types";

const initialParams: CustomerListParams = {
  page: 1,
  limit: 10,
  search: "",
  status: "all",
  sortBy: "name",
  sortDir: "asc",
};

export function CustomersPage() {
  const [params, setParams] = useState(initialParams);
  const query = useCustomersQuery(params);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="border-dashed bg-card/60">
        <CardHeader>
          <CardTitle className="text-2xl">Clientes</CardTitle>
          <CardDescription>
            Buscá, ordená y mantené los datos base de los clientes del taller.
          </CardDescription>
        </CardHeader>
      </Card>
      <CustomersToolbar params={params} onParamsChange={setParams} />
      <CustomersTable
        params={params}
        page={query.data}
        isPending={query.isPending}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        onParamsChange={setParams}
      />
    </main>
  );
}
