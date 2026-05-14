"use client";

import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerFormDialog } from "@/features/customers/customer-form-dialog";
import type { CustomerListParams, CustomerStatus } from "@/lib/customers/types";

export function CustomersToolbar({
  params,
  onParamsChange,
}: {
  params: CustomerListParams;
  onParamsChange: (params: CustomerListParams) => void;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          role="search"
          onSubmit={(event) => event.preventDefault()}
          className="w-full sm:w-80"
        >
          <Label htmlFor="customers-search" className="sr-only">
            Buscar clientes
          </Label>
          <InputGroup className="h-9 bg-background">
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="customers-search"
              type="search"
              value={params.search ?? ""}
              placeholder="Buscar por nombre, documento o email"
              onChange={(event) =>
                onParamsChange({ ...params, search: event.target.value, page: 1 })
              }
            />
          </InputGroup>
        </form>
        <Select
          value={params.status ?? "all"}
          onValueChange={(status) =>
            onParamsChange({
              ...params,
              status: status as CustomerStatus | "all",
              page: 1,
            })
          }
        >
          <SelectTrigger aria-label="Filtrar por estado" className="w-full sm:w-36">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <CustomerFormDialog trigger={<Button type="button">Nuevo cliente</Button>} />
    </div>
  );
}
