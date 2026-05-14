"use client";

import { useState } from "react";
import { SearchIcon } from "lucide-react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { InputGroupAddon } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

export type ComboboxOption = {
  id: string;
  label: string;
  description?: string | null;
};

export function OptionCombobox({
  id,
  label,
  value,
  options,
  inputValue,
  placeholder,
  emptyText,
  error,
  disabled,
  isFetching,
  onInputValueChange,
  onValueChange,
}: {
  id: string;
  label: string;
  value?: string | null;
  options: ComboboxOption[];
  inputValue: string;
  placeholder: string;
  emptyText: string;
  error?: string;
  disabled?: boolean;
  isFetching?: boolean;
  onInputValueChange: (value: string) => void;
  onValueChange: (value: ComboboxOption | null) => void;
}) {
  const [selectedOption, setSelectedOption] = useState<ComboboxOption | null>(
    () => options.find((option) => option.id === value) ?? null,
  );

  function selectOption(option: ComboboxOption | null) {
    setSelectedOption(option);
    onValueChange(option);
  }

  return (
    <Field data-invalid={Boolean(error)} data-disabled={disabled}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Combobox
        items={options}
        value={selectedOption ?? options.find((option) => option.id === value) ?? null}
        itemToStringValue={(option: ComboboxOption) => option.label}
        inputValue={inputValue}
        onInputValueChange={onInputValueChange}
        onValueChange={(option: ComboboxOption | null) => selectOption(option)}
      >
        <ComboboxInput
          id={id}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          showClear
        >
          <InputGroupAddon>
            {isFetching ? <Spinner aria-hidden="true" /> : <SearchIcon aria-hidden="true" />}
          </InputGroupAddon>
        </ComboboxInput>
        <ComboboxContent>
          <ComboboxList>
            {options.map((option) => (
              <ComboboxItem key={option.id} value={option}>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{option.label}</span>
                  {option.description ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </ComboboxItem>
            ))}
            <ComboboxEmpty>{emptyText}</ComboboxEmpty>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <FieldError errors={[{ message: error }]} />
    </Field>
  );
}
