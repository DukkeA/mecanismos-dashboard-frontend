"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { useState } from "react";

import {
  Combobox,
  ComboboxInput,
} from "@/components/ui/combobox";
import {
  InputGroupAddon,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useCustomerSearchQuery } from "@/hooks/use-customers";
import type { Customer } from "@/lib/customers/types";

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const searchQuery = useCustomerSearchQuery({ search: query, limit: 6 });
  const customers = searchQuery.data ?? [];

  function openCustomer(customer: Customer) {
    setQuery("");
    router.push(`/customers/${customer.id}`);
  }

  return (
    <form role="search" onSubmit={(event) => event.preventDefault()} {...props}>
      <Label htmlFor="global-search" className="sr-only">
        Buscar
      </Label>
      <div className="relative">
        <Combobox
          items={customers}
          itemToStringValue={(customer: Customer) => customer.name}
          inputValue={query}
          onInputValueChange={setQuery}
          onValueChange={(customer: Customer | null) => {
            if (customer) openCustomer(customer);
          }}
        >
          <ComboboxInput
            id="global-search"
            type="search"
            placeholder="Buscar clientes..."
            className="h-9 bg-background sm:w-80"
            showClear
          >
            <InputGroupAddon>
              {searchQuery.isFetching ? (
                <Spinner aria-hidden="true" />
              ) : (
                <SearchIcon aria-hidden="true" />
              )}
            </InputGroupAddon>
          </ComboboxInput>
        </Combobox>
        {query.trim().length >= 2 ? (
          <div className="absolute right-0 left-0 z-50 mt-2 rounded-2xl border bg-popover p-1 text-popover-foreground shadow-2xl sm:w-80">
            {customers.length ? (
              customers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  aria-label={`Abrir ${customer.name}`}
                  className="flex w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-accent"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    openCustomer(customer);
                  }}
                  onClick={() => openCustomer(customer)}
                >
                  <CustomerSearchResult customer={customer} />
                </button>
              ))
            ) : !searchQuery.isFetching ? (
              <div className="flex flex-col gap-1 px-3 py-2 text-sm text-muted-foreground">
                <span>No encontramos clientes.</span>
                <Link href="/customers" className="font-medium text-foreground underline">
                  Ir a clientes
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </form>
  );
}

function CustomerSearchResult({ customer }: { customer: Customer }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate font-medium">{customer.name}</span>
      <span className="truncate text-xs text-muted-foreground">
        {customer.documentNumber}
      </span>
    </span>
  );
}
