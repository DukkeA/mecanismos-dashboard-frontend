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
import { useComponentOptionsQuery } from "@/hooks/use-components";
import { useCustomerSearchQuery } from "@/hooks/use-customers";
import { useVehicleOptionsQuery } from "@/hooks/use-vehicles";
import type { ReferenceOption } from "@/lib/vehicles/types";

type SearchResult =
  | { kind: "customer"; id: string; title: string; description: string; href: string }
  | { kind: "vehicle"; id: string; title: string; description: string; href: string }
  | { kind: "component"; id: string; title: string; description: string; href: string };

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const searchQuery = useCustomerSearchQuery({ search: query, limit: 6 });
  const customers = searchQuery.data ?? [];
  const vehiclesQuery = useVehicleOptionsQuery({ search: query, limit: 4 });
  const componentsQuery = useComponentOptionsQuery({ search: query, limit: 4 });
  const results: SearchResult[] = [
    ...customers.map((customer) => ({
      kind: "customer" as const,
      id: customer.id,
      title: customer.name,
      description: customer.documentNumber,
      href: `/customers/${customer.id}`,
    })),
    ...toAssetResults("vehicle", vehiclesQuery.data ?? [], "/vehicles"),
    ...toAssetResults("component", componentsQuery.data ?? [], "/components"),
  ];
  const isFetching = searchQuery.isFetching || vehiclesQuery.isFetching || componentsQuery.isFetching;

  function openResult(result: SearchResult) {
    setQuery("");
    router.push(result.href);
  }

  return (
    <form role="search" onSubmit={(event) => event.preventDefault()} {...props}>
      <Label htmlFor="global-search" className="sr-only">
        Buscar
      </Label>
      <div className="relative">
          <Combobox
          items={results}
          itemToStringValue={(result: SearchResult) => result.title}
          inputValue={query}
          onInputValueChange={setQuery}
          onValueChange={(result: SearchResult | null) => {
            if (result) openResult(result);
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
              {isFetching ? (
                <Spinner aria-hidden="true" />
              ) : (
                <SearchIcon aria-hidden="true" />
              )}
            </InputGroupAddon>
          </ComboboxInput>
        </Combobox>
        {query.trim().length >= 2 ? (
          <div className="absolute right-0 left-0 z-50 mt-2 rounded-2xl border bg-popover p-1 text-popover-foreground shadow-2xl sm:w-80">
            {results.length ? (
              results.map((result) => (
                <button
                  key={`${result.kind}-${result.id}`}
                  type="button"
                  aria-label={`Abrir ${result.title}`}
                  className="flex w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-accent"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    openResult(result);
                  }}
                  onClick={() => openResult(result)}
                >
                  <SearchResultItem result={result} />
                </button>
              ))
            ) : !isFetching ? (
              <div className="flex flex-col gap-1 px-3 py-2 text-sm text-muted-foreground">
                <span>No encontramos resultados.</span>
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

function SearchResultItem({ result }: { result: SearchResult }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate font-medium">{result.title}</span>
      <span className="truncate text-xs text-muted-foreground">
        {result.kind === "customer" ? "Cliente" : result.kind === "vehicle" ? "Vehículo" : "Componente"} · {result.description}
      </span>
    </span>
  );
}

function toAssetResults(
  kind: "vehicle" | "component",
  options: ReferenceOption[],
  baseHref: string,
): SearchResult[] {
  return options.map((option) => ({
    kind,
    id: option.id,
    title: option.label,
    description: option.description ?? "Sin descripción",
    href: `${baseHref}/${option.id}`,
  }));
}
