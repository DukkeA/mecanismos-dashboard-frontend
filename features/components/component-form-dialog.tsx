"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";

import { RichTextField } from "@/components/rich-text/rich-text-field";
import { RequiredFieldLabel } from "@/components/required-field-label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { OptionCombobox } from "@/features/assets/option-combobox";
import { useBrandOptionsQuery } from "@/hooks/use-brands";
import { useComponentTypeOptionsQuery } from "@/hooks/use-component-types";
import { useCreateComponentMutation, useUpdateComponentMutation } from "@/hooks/use-components";
import { useCustomerOptionsQuery } from "@/hooks/use-customers";
import { useVehicleOptionsQuery } from "@/hooks/use-vehicles";
import type { ComponentFormPayload, ComponentUpdatePayload, WorkshopComponent } from "@/lib/components/types";
import type { CustomerDocumentType } from "@/lib/customers/types";
import { canonicalizeLookupLabel } from "@/lib/lookups/canonicalize";
import {
  componentFormSchema,
  componentUpdateSchema,
  emptyComponentFormValues,
  type ComponentFormInput,
} from "@/lib/validation/components";

type FieldErrors = Partial<Record<keyof ComponentFormInput, string>>;

export function ComponentFormDialog({
  component,
  trigger,
  initialCustomerId,
  initialVehicleId,
}: {
  component?: WorkshopComponent;
  trigger: React.ReactNode;
  initialCustomerId?: string;
  initialVehicleId?: string;
}) {
  const [open, setOpen] = useState(false);
  const dialogContentRef = useRef<HTMLDivElement | null>(null);
  const [values, setValues] = useState<ComponentFormInput>(() =>
    getInitialValues(component, initialCustomerId, initialVehicleId),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [componentTypeSearch, setComponentTypeSearch] = useState(component?.componentType?.name ?? "");
  const [brandSearch, setBrandSearch] = useState(component?.brand ?? "");
  const [vehicleSearch, setVehicleSearch] = useState("");

  const customersQuery = useCustomerOptionsQuery({
    search: customerSearch,
    limit: 8,
    isActive: true,
    enabled: !initialCustomerId,
  });
  const componentTypeOptionsQuery = useComponentTypeOptionsQuery({
    search: componentTypeSearch,
    isActive: true,
    limit: 8,
  });
  const brandOptionsQuery = useBrandOptionsQuery({
    search: brandSearch,
    isActive: true,
    limit: 8,
  });
  const vehicleOptionsQuery = useVehicleOptionsQuery({
    search: vehicleSearch,
    customerId: values.customerId,
    limit: 8,
  });
  const createMutation = useCreateComponentMutation();
  const updateMutation = useUpdateComponentMutation();
  const isEditing = Boolean(component);
  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setValues(getInitialValues(component, initialCustomerId, initialVehicleId));
      setErrors({});
      setServerError(null);
      setCustomerSearch("");
      setComponentTypeSearch(component?.componentType?.name ?? "");
      setBrandSearch(component?.brand ?? "");
      setVehicleSearch("");
    }
  }

  const brandOptions = (brandOptionsQuery.data ?? []).map((brand) => ({
    id: brand.id,
    label: brand.label,
    description: brand.description,
  }));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = component
      ? componentUpdateSchema.safeParse(values)
      : componentFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(flattenZodErrors(parsed.error));
      setServerError(null);
      return;
    }
    setErrors({});
    setServerError(null);
    try {
      if (component) {
        await updateMutation.mutateAsync({
          id: component.id,
          input: parsed.data as ComponentUpdatePayload,
        });
      } else {
        await createMutation.mutateAsync(buildComponentCreatePayload(parsed.data as ComponentFormInput));
      }
      setOpen(false);
    } catch {
      setServerError(
        "No pudimos guardar el componente. Revisá que el vehículo pertenezca al mismo cliente e intentá otra vez.",
      );
      toast.error("Revisá que el vehículo pertenezca al mismo cliente e intentá otra vez.");
    }
  }

  function updateField<K extends keyof ComponentFormInput>(key: K, value: ComponentFormInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  const customerOptions = (customersQuery.data ?? []).map((customer) => ({
    id: customer.id,
    label: customer.label,
    description: customer.description,
  }));
  const componentTypeOptions = (componentTypeOptionsQuery.data ?? []).map((option) => ({
    id: option.id,
    label: option.label,
    description: option.description,
  }));
  const showInlineCustomerFields =
    !isEditing &&
    !initialCustomerId &&
    !values.customerId &&
    customerSearch.trim().length >= 2 &&
    !customerOptions.some(
      (option) => canonicalizeLookupLabel(option.label) === canonicalizeLookupLabel(customerSearch),
    );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent ref={dialogContentRef} className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar componente" : "Nuevo componente"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualizá el componente y su vínculo opcional a vehículo."
              : "Cargá un componente asociado a un cliente; el vehículo es opcional."}
          </DialogDescription>
        </DialogHeader>
        <form id="component-form" className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {serverError ? (
            <Alert variant="destructive">
              <AlertTitle>No pudimos guardar el componente</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup className="gap-4">
            {isEditing ? (
              <Field data-disabled>
                <FieldLabel>Cliente</FieldLabel>
                <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  {component?.customerId ?? "Cliente actual"} · no se reasigna desde edición
                </p>
              </Field>
            ) : (
              <OptionCombobox
                id="component-customer"
                label="Cliente"
                value={values.customerId}
                options={customerOptions}
                selectedOption={
                  initialCustomerId
                    ? { id: initialCustomerId, label: initialCustomerId, description: "Cliente preseleccionado" }
                    : undefined
                }
                inputValue={customerSearch}
                placeholder="Buscar o escribir cliente"
                emptyText="No encontramos clientes."
                error={errors.customerId}
                required
                disabled={isPending || Boolean(initialCustomerId)}
                isFetching={customersQuery.isFetching}
                modal
                portalContainer={dialogContentRef}
                freeText
                onInputValueChange={(value) => {
                  setCustomerSearch(value);
                  if (values.customerId && value.trim()) return;
                  const exact = customerOptions.find(
                    (option) => canonicalizeLookupLabel(option.label) === canonicalizeLookupLabel(value),
                  );
                  updateField("customerId", exact?.id ?? "");
                  updateField("customerName", exact ? "" : value);
                  if (!exact || exact.id !== values.customerId) updateField("vehicleId", undefined);
                }}
                onValueChange={(option) => {
                  updateField("customerId", option?.id ?? "");
                  updateField("customerName", "");
                  updateField("vehicleId", undefined);
                  if (option) setCustomerSearch(option.label);
                }}
              />
            )}
            {showInlineCustomerFields ? <InlineCustomerFields values={values} errors={errors} disabled={isPending} updateField={updateField} fallbackName={customerSearch} /> : null}
            <OptionCombobox
              id="component-type"
              label="Tipo"
              value={values.componentTypeId}
              options={componentTypeOptions}
              inputValue={componentTypeSearch}
              placeholder="Buscar o escribir tipo"
              emptyText="No encontramos tipos. Se creará al guardar."
              error={errors.componentTypeId ?? errors.componentTypeName}
              required
              disabled={isPending}
              isFetching={componentTypeOptionsQuery.isFetching}
              modal
              portalContainer={dialogContentRef}
              freeText
              onInputValueChange={(value) => {
                setComponentTypeSearch(value);
                if (values.componentTypeId && value.trim()) return;
                updateField("componentTypeName", value);
                const exact = componentTypeOptions.find(
                  (option) => canonicalizeLookupLabel(option.label) === canonicalizeLookupLabel(value),
                );
                updateField("componentTypeId", exact?.id ?? "");
              }}
              onValueChange={(option) => {
                if (!option) return;
                updateField("componentTypeId", option?.id ?? "");
                updateField("componentTypeName", option?.label ?? componentTypeSearch);
                setComponentTypeSearch(option.label);
              }}
            />
            <OptionCombobox
              id="component-vehicle"
              label="Vehículo opcional"
              value={values.vehicleId ?? undefined}
              options={(vehicleOptionsQuery.data ?? []).map((option) => ({
                id: option.id,
                label: option.label,
                description: option.description,
              }))}
              inputValue={vehicleSearch}
              placeholder="Buscar vehículo o dejar vacío"
              emptyText="No encontramos vehículos para este cliente."
              error={errors.vehicleId}
              disabled={isPending || !values.customerId}
              isFetching={vehicleOptionsQuery.isFetching}
              modal
              portalContainer={dialogContentRef}
              onInputValueChange={(value) => {
                setVehicleSearch(value);
                const exact = (vehicleOptionsQuery.data ?? []).find(
                  (option) => canonicalizeLookupLabel(option.label) === canonicalizeLookupLabel(value),
                );
                updateField("vehicleId", exact?.id ?? (component ? null : undefined));
              }}
              onValueChange={(option) => updateField("vehicleId", option?.id ?? (component ? null : undefined))}
            />
            {!values.customerId ? (
              <p className="text-sm text-muted-foreground">
                Podés vincular un vehículo existente después de seleccionar un cliente guardado.
              </p>
            ) : null}
            {component?.vehicleId ? (
              <Button type="button" variant="outline" className="w-fit" disabled={isPending} onClick={() => updateField("vehicleId", null)}>
                Quitar vínculo con vehículo
              </Button>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <OptionCombobox
                id="component-brand"
                label="Marca"
                value={values.brandId}
                options={brandOptions}
                inputValue={brandSearch}
                placeholder="Buscar o escribir marca"
                emptyText="No encontramos marcas. Se creará al guardar."
                error={errors.brand}
                disabled={isPending}
                required
                isFetching={brandOptionsQuery.isFetching}
                modal
                portalContainer={dialogContentRef}
                freeText
                onInputValueChange={(value) => {
                  setBrandSearch(value);
                  const exact = brandOptions.find(
                    (option) => canonicalizeLookupLabel(option.label) === canonicalizeLookupLabel(value),
                  );
                  updateField("brandId", exact?.id ?? "");
                  updateField("brand", exact?.label ?? value);
                }}
                onValueChange={(option) => {
                  updateField("brandId", option?.id ?? "");
                  updateField("brand", option?.label ?? brandSearch);
                  if (option) setBrandSearch(option.label);
                }}
              />
              <TextField id="component-reference" label="Referencia" value={values.reference} error={errors.reference} disabled={isPending} required onChange={(value) => updateField("reference", value)} />
              <TextField id="component-identifier" label="Identificador" value={values.identifier ?? ""} error={errors.identifier} disabled={isPending} onChange={(value) => updateField("identifier", value)} />
            </div>
            <RichTextField id="component-notes" label="Notas" value={values.notes} error={errors.notes} disabled={isPending} onChange={(value) => updateField("notes", value)} />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="component-form" disabled={isPending}>
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            {isEditing ? "Guardar cambios" : "Crear componente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InlineCustomerFields({
  values,
  errors,
  disabled,
  fallbackName,
  updateField,
}: {
  values: ComponentFormInput;
  errors: FieldErrors;
  disabled?: boolean;
  fallbackName: string;
  updateField: <K extends keyof ComponentFormInput>(key: K, value: ComponentFormInput[K]) => void;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-sm font-medium">Crear cliente con este componente</p>
      <p className="mt-1 text-sm text-muted-foreground">
        No encontramos un cliente con ese nombre; completá los datos requeridos.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <TextField id="component-customer-name" label="Nombre o razón social" value={values.customerName ?? fallbackName} error={errors.customerName} disabled={disabled} required onChange={(value) => updateField("customerName", value)} />
        <Field data-invalid={Boolean(errors.customerDocumentType)} data-disabled={disabled}>
          <RequiredFieldLabel htmlFor="component-customer-document-type">Tipo de documento</RequiredFieldLabel>
          <Select value={values.customerDocumentType ?? "NIT"} disabled={disabled} onValueChange={(value) => updateField("customerDocumentType", value as CustomerDocumentType)}>
            <SelectTrigger id="component-customer-document-type" aria-invalid={Boolean(errors.customerDocumentType)}><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
            <SelectContent><SelectGroup><SelectItem value="NIT">NIT</SelectItem><SelectItem value="CEDULA">Cédula</SelectItem></SelectGroup></SelectContent>
          </Select>
          <FieldError errors={[{ message: errors.customerDocumentType }]} />
        </Field>
        <TextField id="component-customer-document" label="Documento / NIT" value={values.customerDocumentNumber ?? ""} error={errors.customerDocumentNumber} disabled={disabled} required onChange={(value) => updateField("customerDocumentNumber", value)} />
        <TextField id="component-customer-phone" label="Teléfono" value={values.customerPhone ?? ""} error={errors.customerPhone} disabled={disabled} required onChange={(value) => updateField("customerPhone", value)} />
      </div>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  error,
  disabled,
  required,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field data-invalid={Boolean(error)} data-disabled={disabled}>
      {required ? <RequiredFieldLabel htmlFor={id}>{label}</RequiredFieldLabel> : <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <Input id={id} value={value} disabled={disabled} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} />
      <FieldError errors={[{ message: error }]} />
    </Field>
  );
}

function getInitialValues(
  component?: WorkshopComponent,
  initialCustomerId?: string,
  initialVehicleId?: string,
): ComponentFormInput {
  if (!component) {
    return {
      ...emptyComponentFormValues,
      customerId: initialCustomerId ?? "",
      vehicleId: initialVehicleId,
    };
  }

  return {
    customerId: component.customerId,
    customerName: "",
    customerDocumentType: "NIT",
    customerDocumentNumber: "",
    customerPhone: "",
    componentTypeId: component.componentTypeId,
    componentTypeName: component.componentType?.name ?? "",
    vehicleId: component.vehicleId ?? undefined,
    brandId: "",
    brand: component.brand,
    reference: component.reference,
    identifier: component.identifier ?? "",
    notes: component.notes,
  };
}

export function buildComponentCreatePayload(values: ComponentFormInput): ComponentFormPayload {
  const payload: ComponentFormPayload = {
    vehicleId: values.vehicleId,
    reference: values.reference,
    identifier: values.identifier,
    notes: values.notes,
  };

  if (values.customerId) {
    payload.customerId = values.customerId;
  } else {
    payload.customer = {
      name: values.customerName ?? "",
      documentType: values.customerDocumentType ?? "NIT",
      documentNumber: values.customerDocumentNumber ?? "",
      phone: values.customerPhone ?? "",
      isActive: true,
    };
  }

  if (values.componentTypeId) {
    payload.componentTypeId = values.componentTypeId;
  } else {
    payload.componentType = { name: values.componentTypeName ?? "" };
  }

  if (values.brandId) {
    payload.brandId = values.brandId;
  } else {
    payload.brandName = values.brand;
  }

  return payload;
}

function flattenZodErrors(error: z.ZodError<unknown>) {
  const fieldErrors = error.flatten().fieldErrors;
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : undefined,
    ]),
  ) as FieldErrors;
}
