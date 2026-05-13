"use client";

import { SearchIcon } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  return (
    <form
      role="search"
      onSubmit={(event) => event.preventDefault()}
      {...props}
    >
      <Label htmlFor="global-search" className="sr-only">
        Buscar
      </Label>
      <InputGroup className="h-9 bg-background sm:w-80">
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          id="global-search"
          type="search"
          placeholder="Buscar órdenes, clientes o vehículos..."
        />
      </InputGroup>
    </form>
  );
}
