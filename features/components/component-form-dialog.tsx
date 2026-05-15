"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RichTextField } from "@/components/rich-text/rich-text-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { OptionCombobox } from "@/features/assets/option-combobox";
import { useComponentTypeOptionsQuery } from "@/hooks/use-component-types";
import { useCreateComponentMutation, useUpdateComponentMutation } from "@/hooks/use-components";
import { useCustomerSearchQuery } from "@/hooks/use-customers";
import { useVehicleOptionsQuery } from "@/hooks/use-vehicles";
import type { ComponentFormPayload, ComponentUpdatePayload, WorkshopComponent } from "@/lib/components/types";
import { componentFormSchema, componentUpdateSchema, emptyComponentFormValues, type ComponentFormInput } from "@/lib/validation/components";

type FieldErrors = Partial<Record<keyof ComponentFormInput, string>>;

export function ComponentFormDialog({ component, trigger, initialCustomerId, initialVehicleId }: { component?: WorkshopComponent; trigger: React.ReactNode; initialCustomerId?: string; initialVehicleId?: string }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ComponentFormInput>(() => getInitialValues(component, initialCustomerId, initialVehicleId));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const customersQuery = useCustomerSearchQuery({ search: customerSearch, limit: 8 });
  const vehicleOptionsQuery = useVehicleOptionsQuery({ search: vehicleSearch, customerId: values.customerId, limit: 8 });
  const componentTypeOptionsQuery = useComponentTypeOptionsQuery({ isActive: true, limit: 50 });
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
      setVehicleSearch("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = component ? componentUpdateSchema.safeParse(values) : componentFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(flattenZodErrors(parsed.error));
      setServerError(null);
      return;
    }
    setErrors({});
    setServerError(null);
    try {
      if (component) {
        await updateMutation.mutateAsync({ id: component.id, input: parsed.data as ComponentUpdatePayload });
      } else {
        await createMutation.mutateAsync(parsed.data as ComponentFormPayload);
      }
      setOpen(false);
    } catch {
      setServerError("No pudimos guardar el componente. Revisá que el vehículo pertenezca al mismo cliente e intentá otra vez.");
      toast.error("Revisá que el vehículo pertenezca al mismo cliente e intentá otra vez.");
    }
  }

  function updateField<K extends keyof ComponentFormInput>(key: K, value: ComponentFormInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar componente" : "Nuevo componente"}</DialogTitle>
          <DialogDescription>{isEditing ? "Actualizá el componente y su vínculo opcional a vehículo." : "Cargá un componente asociado a un cliente; el vehículo es opcional."}</DialogDescription>
        </DialogHeader>
        <form id="component-form" className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {serverError ? <Alert variant="destructive"><AlertTitle>No pudimos guardar el componente</AlertTitle><AlertDescription>{serverError}</AlertDescription></Alert> : null}
          <FieldGroup className="gap-4">
            {!isEditing ? <OptionCombobox id="component-customer" label="Cliente" value={values.customerId} options={(customersQuery.data ?? []).map((customer) => ({ id: customer.id, label: customer.name, description: customer.documentNumber }))} inputValue={customerSearch} placeholder="Buscar cliente" emptyText="No encontramos clientes." error={errors.customerId} disabled={isPending || Boolean(initialCustomerId)} isFetching={customersQuery.isFetching} onInputValueChange={setCustomerSearch} onValueChange={(option) => { updateField("customerId", option?.id ?? ""); updateField("vehicleId", undefined); }} /> : null}
            <Field data-invalid={Boolean(errors.componentTypeId)} data-disabled={isPending}>
              <FieldLabel htmlFor="component-type">Tipo</FieldLabel>
              <Select value={values.componentTypeId} disabled={isPending} onValueChange={(value) => updateField("componentTypeId", value)}>
                <SelectTrigger id="component-type" aria-invalid={Boolean(errors.componentTypeId)}><SelectValue placeholder={componentTypeOptionsQuery.isPending ? "Cargando tipos" : "Seleccionar tipo"} /></SelectTrigger>
                <SelectContent><SelectGroup>{(componentTypeOptionsQuery.data ?? []).map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}</SelectGroup></SelectContent>
              </Select>
              <FieldError errors={[{ message: errors.componentTypeId }]} />
            </Field>
            <OptionCombobox id="component-vehicle" label="Vehículo opcional" value={values.vehicleId ?? undefined} options={(vehicleOptionsQuery.data ?? []).map((option) => ({ id: option.id, label: option.label, description: option.description }))} inputValue={vehicleSearch} placeholder="Buscar vehículo o dejar vacío" emptyText="No encontramos vehículos para este cliente." error={errors.vehicleId} disabled={isPending || !values.customerId} isFetching={vehicleOptionsQuery.isFetching} onInputValueChange={setVehicleSearch} onValueChange={(option) => updateField("vehicleId", option?.id ?? (component ? null : undefined))} />
            {component?.vehicleId ? <Button type="button" variant="outline" className="w-fit" disabled={isPending} onClick={() => updateField("vehicleId", null)}>Quitar vínculo con vehículo</Button> : null}
            <div className="grid gap-4 md:grid-cols-2">
              <TextField id="component-brand" label="Marca" value={values.brand} error={errors.brand} disabled={isPending} onChange={(value) => updateField("brand", value)} />
              <TextField id="component-reference" label="Referencia" value={values.reference} error={errors.reference} disabled={isPending} onChange={(value) => updateField("reference", value)} />
              <TextField id="component-identifier" label="Identificador" value={values.identifier ?? ""} error={errors.identifier} disabled={isPending} onChange={(value) => updateField("identifier", value)} />
            </div>
            <RichTextField id="component-notes" label="Notas" value={values.notes} error={errors.notes} disabled={isPending} onChange={(value) => updateField("notes", value)} />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isPending} onClick={() => setOpen(false)}>Cancelar</Button>
          <Button type="submit" form="component-form" disabled={isPending}>{isPending ? <Spinner data-icon="inline-start" /> : null}{isEditing ? "Guardar cambios" : "Crear componente"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TextField({ id, label, value, error, disabled, onChange }: { id: string; label: string; value: string; error?: string; disabled?: boolean; onChange: (value: string) => void }) {
  return <Field data-invalid={Boolean(error)} data-disabled={disabled}><FieldLabel htmlFor={id}>{label}</FieldLabel><Input id={id} value={value} disabled={disabled} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} /><FieldError errors={[{ message: error }]} /></Field>;
}

function getInitialValues(component?: WorkshopComponent, initialCustomerId?: string, initialVehicleId?: string): ComponentFormInput {
  if (!component) return { ...emptyComponentFormValues, customerId: initialCustomerId ?? "", vehicleId: initialVehicleId };
  return { customerId: component.customerId, componentTypeId: component.componentTypeId, vehicleId: component.vehicleId ?? undefined, brand: component.brand, reference: component.reference, identifier: component.identifier ?? "", notes: component.notes };
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
