"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";

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
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { OptionCombobox } from "@/features/assets/option-combobox";
import {
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
} from "@/hooks/use-vehicles";
import { useCustomerSearchQuery } from "@/hooks/use-customers";
import type { Vehicle, VehicleFormPayload, VehicleUpdatePayload } from "@/lib/vehicles/types";
import {
  emptyVehicleFormValues,
  vehicleFormSchema,
  vehicleUpdateSchema,
  type VehicleFormInput,
} from "@/lib/validation/vehicles";

type FieldErrors = Partial<Record<keyof VehicleFormInput, string>>;

export function VehicleFormDialog({
  vehicle,
  trigger,
  initialCustomerId,
}: {
  vehicle?: Vehicle;
  trigger: React.ReactNode;
  initialCustomerId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<VehicleFormInput>(() =>
    getInitialValues(vehicle, initialCustomerId),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const customersQuery = useCustomerSearchQuery({ search: customerSearch, limit: 8 });
  const createMutation = useCreateVehicleMutation();
  const updateMutation = useUpdateVehicleMutation();
  const isEditing = Boolean(vehicle);
  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setValues(getInitialValues(vehicle, initialCustomerId));
      setErrors({});
      setServerError(null);
      setCustomerSearch("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = vehicle
      ? vehicleUpdateSchema.safeParse(values)
      : vehicleFormSchema.safeParse(values);

    if (!parsed.success) {
      setErrors(flattenZodErrors(parsed.error));
      setServerError(null);
      return;
    }

    setErrors({});
    setServerError(null);
    try {
      if (vehicle) {
        await updateMutation.mutateAsync({ id: vehicle.id, input: parsed.data as VehicleUpdatePayload });
      } else {
        await createMutation.mutateAsync(parsed.data as VehicleFormPayload);
      }
      setOpen(false);
    } catch {
      setServerError("No pudimos guardar el vehículo. Revisá los datos y volvé a intentar.");
      toast.error("Revisá los datos del vehículo y volvé a intentar.");
    }
  }

  function updateField<K extends keyof VehicleFormInput>(key: K, value: VehicleFormInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar vehículo" : "Nuevo vehículo"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualizá marca, modelo, patente y notas sin reasignar el cliente."
              : "Cargá un vehículo asociado a un cliente existente."}
          </DialogDescription>
        </DialogHeader>
        <form id="vehicle-form" className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {serverError ? (
            <Alert variant="destructive">
              <AlertTitle>No pudimos guardar el vehículo</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup className="gap-4">
            {!isEditing ? (
              <OptionCombobox
                id="vehicle-customer"
                label="Cliente"
                value={values.customerId}
                options={(customersQuery.data ?? []).map((customer) => ({
                  id: customer.id,
                  label: customer.name,
                  description: customer.documentNumber,
                }))}
                inputValue={customerSearch}
                placeholder={initialCustomerId ? "Cliente preseleccionado" : "Buscar cliente"}
                emptyText="No encontramos clientes."
                error={errors.customerId}
                disabled={isPending || Boolean(initialCustomerId)}
                isFetching={customersQuery.isFetching}
                onInputValueChange={setCustomerSearch}
                onValueChange={(option) => updateField("customerId", option?.id ?? "")}
              />
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <TextField id="vehicle-brand" label="Marca" value={values.brand} error={errors.brand} disabled={isPending} onChange={(value) => updateField("brand", value)} />
              <TextField id="vehicle-model" label="Modelo / referencia" value={values.modelReference} error={errors.modelReference} disabled={isPending} onChange={(value) => updateField("modelReference", value)} />
              <TextField id="vehicle-plate" label="Patente" value={values.plate} error={errors.plate} disabled={isPending} onChange={(value) => updateField("plate", value)} />
            </div>
            <Field data-invalid={Boolean(errors.notes)} data-disabled={isPending}>
              <FieldLabel htmlFor="vehicle-notes">Notas</FieldLabel>
              <Textarea id="vehicle-notes" value={values.notes ?? ""} disabled={isPending} aria-invalid={Boolean(errors.notes)} onChange={(event) => updateField("notes", event.target.value)} />
              <FieldError errors={[{ message: errors.notes }]} />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="vehicle-form" disabled={isPending}>
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            {isEditing ? "Guardar cambios" : "Crear vehículo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TextField({ id, label, value, error, disabled, onChange }: { id: string; label: string; value: string; error?: string; disabled?: boolean; onChange: (value: string) => void }) {
  return (
    <Field data-invalid={Boolean(error)} data-disabled={disabled}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} value={value} disabled={disabled} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} />
      <FieldError errors={[{ message: error }]} />
    </Field>
  );
}

function getInitialValues(vehicle?: Vehicle, initialCustomerId?: string): VehicleFormInput {
  if (!vehicle) return { ...emptyVehicleFormValues, customerId: initialCustomerId ?? "" };

  return {
    customerId: vehicle.customerId,
    brand: vehicle.brand,
    modelReference: vehicle.modelReference,
    plate: vehicle.plate,
    notes: vehicle.notes ?? "",
  };
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
