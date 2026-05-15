"use client";

import Link from "next/link";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowUpDownIcon,
  MoreHorizontalIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { CustomerFormDialog } from "@/features/customers/customer-form-dialog";
import type { Customer, CustomerSortField, SortDirection } from "@/lib/customers/types";

export type CustomerColumn = {
  key: CustomerSortField | "status" | "actions";
  label: string;
  hideOnMobile?: boolean;
  sortable?: boolean;
};

export const customerColumns: CustomerColumn[] = [
  { key: "name", label: "Cliente", sortable: true },
  { key: "documentNumber", label: "Documento", sortable: true, hideOnMobile: true },
  { key: "email", label: "Email", sortable: true, hideOnMobile: true },
  { key: "phone", label: "Teléfono", sortable: true, hideOnMobile: true },
  { key: "status", label: "Estado" },
  { key: "actions", label: "Acciones" },
];

export function SortButton({
  field,
  label,
  sortBy,
  sortDir,
  onSort,
}: {
  field: CustomerSortField;
  label: string;
  sortBy?: CustomerSortField;
  sortDir?: SortDirection;
  onSort: (field: CustomerSortField) => void;
}) {
  const isActive = sortBy === field;
  const Icon = !isActive
    ? ArrowUpDownIcon
    : sortDir === "asc"
      ? ArrowUpIcon
      : ArrowDownIcon;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-3"
      onClick={() => onSort(field)}
      aria-label={`Ordenar por ${label}`}
    >
      {label}
      <Icon data-icon="inline-end" aria-hidden="true" />
    </Button>
  );
}

export function CustomerStatusBadge({ status }: { status: Customer["status"] }) {
  return (
    <Badge variant={status === "active" ? "secondary" : "outline"}>
      {status === "active" ? "Activo" : "Inactivo"}
    </Badge>
  );
}

export function CustomerActions({
  customer,
}: {
  customer: Customer;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${customer.name}`}>
          <MoreHorizontalIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/customers/${customer.id}`}>Ver detalle</Link>
        </DropdownMenuItem>
        <CustomerFormDialog
          customer={customer}
          trigger={<DropdownMenuItem onSelect={(event) => event.preventDefault()}>Editar cliente</DropdownMenuItem>}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
