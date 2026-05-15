"use client";

import Link from "next/link";
import { AlertCircleIcon, UsersRoundIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CustomerActions,
  customerColumns,
  CustomerStatusBadge,
  SortButton,
} from "@/features/customers/customers-columns";
import { CustomerFormDialog } from "@/features/customers/customer-form-dialog";
import { CustomersPagination } from "@/features/customers/customers-pagination";
import type {
  Customer,
  CustomerListParams,
  CustomersPage,
  CustomerSortField,
} from "@/lib/customers/types";
import { extractPlainTextFromRichText } from "@/lib/rich-text";

export function CustomersTable({
  params,
  page,
  isPending,
  isError,
  onRetry,
  onParamsChange,
}: {
  params: CustomerListParams;
  page?: CustomersPage;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  onParamsChange: (params: CustomerListParams) => void;
}) {
  const rows = page?.data ?? [];

  if (isPending) return <CustomersTableSkeleton />;

  if (isError) {
    return (
      <Alert>
        <AlertCircleIcon aria-hidden="true" />
        <AlertTitle>No pudimos cargar los clientes</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>Reintentá la consulta sin perder los filtros actuales.</span>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!rows.length) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersRoundIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No hay clientes para mostrar</EmptyTitle>
          <EmptyDescription>
            Probá con otros filtros o cargá el primer cliente del taller.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CustomerFormDialog trigger={<Button type="button">Crear cliente</Button>} />
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <Card className="gap-0 p-0">
      <CardContent className="p-0">
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                {customerColumns.map((column) => (
                  <TableHead key={column.key} className={column.key === "actions" ? "text-right" : undefined}>
                    {column.sortable ? (
                      <SortButton
                        field={column.key as CustomerSortField}
                        label={column.label}
                        sortBy={params.sortBy}
                        sortDir={params.sortDir}
                        onSort={(field) => onSort(field, params, onParamsChange)}
                      />
                    ) : (
                      column.label
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    <Link href={`/customers/${customer.id}`} className="hover:underline">
                      {customer.name}
                    </Link>
                  </TableCell>
                  <TableCell>{customer.documentNumber}</TableCell>
                  <TableCell>{customer.email ?? "—"}</TableCell>
                  <TableCell>{customer.phone ?? "—"}</TableCell>
                  <TableCell><CustomerStatusBadge status={customer.status} /></TableCell>
                  <TableCell className="text-right">
                    <CustomerActions customer={customer} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="grid gap-3 p-4 md:hidden">
          {rows.map((customer) => (
            <MobileCustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      </CardContent>
      {page ? (
        <CustomersPagination
          params={params}
          meta={page.meta}
          onParamsChange={onParamsChange}
        />
      ) : null}
    </Card>
  );
}

function MobileCustomerCard({ customer }: { customer: Customer }) {
  const notePreview = extractPlainTextFromRichText(customer.notes, 100);
  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/customers/${customer.id}`} className="font-medium hover:underline">
            {customer.name}
          </Link>
          <p className="text-sm text-muted-foreground">{customer.documentNumber}</p>
        </div>
        <CustomerStatusBadge status={customer.status} />
      </div>
      <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
        <span>{customer.email ?? "Sin email"}</span>
        <span>{customer.phone ?? "Sin teléfono"}</span>
        {notePreview ? <span>{notePreview}</span> : null}
      </div>
      <div className="mt-4 flex gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/customers/${customer.id}`}>Ver detalle</Link>
        </Button>
        <CustomerFormDialog
          customer={customer}
          trigger={<Button type="button" variant="ghost" size="sm">Editar</Button>}
        />
      </div>
    </div>
  );
}

function CustomersTableSkeleton() {
  return (
    <Card aria-label="Cargando clientes" role="status">
      <CardContent className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

function onSort(
  field: CustomerSortField,
  params: CustomerListParams,
  onParamsChange: (params: CustomerListParams) => void,
) {
  const isSameField = params.sortBy === field;
  const nextDir = isSameField && params.sortDir === "asc" ? "desc" : "asc";
  onParamsChange({ ...params, sortBy: field, sortDir: nextDir, page: 1 });
}
