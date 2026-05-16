"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { Combobox as ComboboxPrimitive } from "@base-ui/react";
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
import { RequiredFieldLabel } from "@/components/required-field-label";
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
  selectedOption: selectedOptionProp,
  inputValue,
  placeholder,
  emptyText,
  error,
  required,
  disabled,
  isFetching,
  modal,
  portalContainer,
  freeText,
  onInputValueChange,
  onValueChange,
}: {
  id: string;
  label: string;
  value?: string | null;
  options: ComboboxOption[];
  selectedOption?: ComboboxOption | null;
  inputValue: string;
  placeholder: string;
  emptyText: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  isFetching?: boolean;
  modal?: boolean;
  portalContainer?: HTMLElement | null | RefObject<HTMLElement | null>;
  freeText?: boolean;
  onInputValueChange: (value: string) => void;
  onValueChange: (value: ComboboxOption | null) => void;
}) {
  const resolvedSelectedOption =
    selectedOptionProp ?? options.find((option) => option.id === value) ?? null;
  const comboboxValue =
    resolvedSelectedOption ??
    (freeText && inputValue.trim()
      ? { id: `__free_text__:${inputValue}`, label: inputValue, description: null }
      : null);
  const latestInputValueRef = useRef(inputValue);

  useEffect(() => {
    latestInputValueRef.current = inputValue;
  }, [inputValue]);

  function selectOption(option: ComboboxOption | null) {
    onValueChange(option);
  }

  function handleInputValueChange(
    nextInputValue: string,
    eventDetails?: ComboboxPrimitive.Root.ChangeEventDetails,
  ) {
    if (
      shouldIgnoreFreeTextReset({
        freeText,
        currentInputValue: latestInputValueRef.current,
        nextInputValue,
        selectedOption: resolvedSelectedOption,
        reason: eventDetails?.reason,
      })
    ) {
      return;
    }

    latestInputValueRef.current = nextInputValue;
    onInputValueChange(nextInputValue);
  }

  return (
    <Field data-invalid={Boolean(error)} data-disabled={disabled}>
      {required ? (
        <RequiredFieldLabel htmlFor={id}>{label}</RequiredFieldLabel>
      ) : (
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
      )}
      <Combobox
        items={options}
        value={comboboxValue}
        modal={modal}
        itemToStringValue={(option: ComboboxOption) => option.label}
        inputValue={inputValue}
        onInputValueChange={handleInputValueChange}
        onValueChange={(option: ComboboxOption | null) => selectOption(option)}
      >
        <ComboboxInput
          id={id}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-required={required || undefined}
          onChange={(event) => {
            latestInputValueRef.current = event.currentTarget.value;
            onInputValueChange(event.currentTarget.value);
          }}
          showClear
        >
          <InputGroupAddon>
            {isFetching ? (
              <Spinner aria-label={`Cargando ${label.toLowerCase()}`} />
            ) : (
              <SearchIcon aria-hidden="true" />
            )}
          </InputGroupAddon>
        </ComboboxInput>
        <ComboboxContent container={portalContainer}>
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

function shouldIgnoreFreeTextReset({
  freeText,
  currentInputValue,
  nextInputValue,
  selectedOption,
  reason,
}: {
  freeText?: boolean;
  currentInputValue: string;
  nextInputValue: string;
  selectedOption: ComboboxOption | null;
  reason?: ComboboxPrimitive.Root.ChangeEventDetails["reason"];
}) {
  const isIntentionalClear =
    reason === "input-clear" || reason === "clear-press";

  return Boolean(
    freeText &&
      !selectedOption &&
      currentInputValue.trim() &&
      nextInputValue === "" &&
      !isIntentionalClear,
  );
}
