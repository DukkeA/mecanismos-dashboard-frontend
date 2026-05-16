"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RichTextField } from "@/components/rich-text/rich-text-field";
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RequiredFieldLabel } from "@/components/required-field-label";
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
import {
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
} from "@/hooks/use-vehicles";
import { useCustomerOptionsQuery } from "@/hooks/use-customers";
import type { CustomerDocumentType } from "@/lib/customers/types";
import { canonicalizeLookupLabel } from "@/lib/lookups/canonicalize";
import type {
  Vehicle,
  VehicleFormPayload,
  VehicleUpdatePayload,
} from "@/lib/vehicles/types";
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
  const dialogContentRef = useRef<HTMLDivElement | null>(null);
  const [values, setValues] = useState<VehicleFormInput>(() =>
    getInitialValues(vehicle, initialCustomerId),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState(vehicle?.brand ?? "");
  const customersQuery = useCustomerOptionsQuery({
    search: customerSearch,
    limit: 8,
    isActive: true,
    enabled: !initialCustomerId,
  });
  const brandOptionsQuery = useBrandOptionsQuery({
    search: brandSearch,
    limit: 8,
    isActive: true,
  });
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
      setBrandSearch(vehicle?.brand ?? "");
    }
  }

  const brandOptions = (brandOptionsQuery.data ?? []).map((brand) => ({
    id: brand.id,
    label: brand.label,
    description: brand.description,
  }));

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
        await updateMutation.mutateAsync({
          id: vehicle.id,
          input: parsed.data as VehicleUpdatePayload,
        });
      } else {
        await createMutation.mutateAsync(buildVehicleCreatePayload(parsed.data as VehicleFormInput));
      }
      setOpen(false);
    } catch {
      setServerError(
        "No pudimos guardar el vehículo. Revisá los datos y volvé a intentar.",
      );
      toast.error("Revisá los datos del vehículo y volvé a intentar.");
    }
  }

  function updateField<K extends keyof VehicleFormInput>(
    key: K,
    value: VehicleFormInput[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  const customerOptions = (customersQuery.data ?? []).map((customer) => ({
    id: customer.id,
    label: customer.label,
    description: customer.description,
  }));
  const hasExactCustomerMatch = customerOptions.some(
    (option) => canonicalizeLookupLabel(option.label) === canonicalizeLookupLabel(customerSearch),
  );
  const showInlineCustomerFields =
    !isEditing &&
    !initialCustomerId &&
    !values.customerId &&
    customerSearch.trim().length >= 2 &&
    !hasExactCustomerMatch;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent ref={dialogContentRef} className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar vehículo" : "Nuevo vehículo"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualizá marca, modelo, placa y notas sin reasignar el cliente."
              : "Cargá un vehículo asociado a un cliente existente."}
          </DialogDescription>
        </DialogHeader>
        <form
          id="vehicle-form"
          className="flex flex-col gap-6"
          onSubmit={handleSubmit}
        >
          {serverError ? (
            <Alert variant="destructive">
              <AlertTitle>No pudimos guardar el vehículo</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup className="gap-4">
            {isEditing ? (
              <Field data-disabled>
                <FieldLabel>Cliente</FieldLabel>
                <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  {vehicle?.customerId ?? "Cliente actual"} · no se reasigna
                  desde edición
                </p>
              </Field>
            ) : (
              <OptionCombobox
                id="vehicle-customer"
                label="Cliente"
                value={values.customerId}
                options={customerOptions}
                selectedOption={
                  initialCustomerId
                    ? {
                        id: initialCustomerId,
                        label: initialCustomerId,
                        description: "Cliente preseleccionado",
                      }
                    : undefined
                }
                inputValue={customerSearch}
                placeholder={
                  initialCustomerId
                    ? "Cliente preseleccionado"
                    : "Buscar cliente"
                }
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
                }}
                onValueChange={(option) => {
                  updateField("customerId", option?.id ?? "");
                  updateField("customerName", "");
                  if (option) setCustomerSearch(option.label);
                }}
              />
            )}
            {showInlineCustomerFields ? (
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium">Crear cliente con este vehículo</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  No encontramos un cliente con ese nombre; completá los datos requeridos.
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <TextField id="vehicle-customer-name" label="Nombre o razón social" value={values.customerName ?? customerSearch} error={errors.customerName} disabled={isPending} required onChange={(value) => updateField("customerName", value)} />
                  <Field data-invalid={Boolean(errors.customerDocumentType)} data-disabled={isPending}>
                    <RequiredFieldLabel htmlFor="vehicle-customer-document-type">Tipo de documento</RequiredFieldLabel>
                    <Select value={values.customerDocumentType ?? "NIT"} disabled={isPending} onValueChange={(value) => updateField("customerDocumentType", value as CustomerDocumentType)}>
                      <SelectTrigger id="vehicle-customer-document-type" aria-invalid={Boolean(errors.customerDocumentType)}><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                      <SelectContent><SelectGroup><SelectItem value="NIT">NIT</SelectItem><SelectItem value="CEDULA">Cédula</SelectItem></SelectGroup></SelectContent>
                    </Select>
                    <FieldError errors={[{ message: errors.customerDocumentType }]} />
                  </Field>
                  <TextField id="vehicle-customer-document" label="Documento / NIT" value={values.customerDocumentNumber ?? ""} error={errors.customerDocumentNumber} disabled={isPending} required onChange={(value) => updateField("customerDocumentNumber", value)} />
                  <TextField id="vehicle-customer-phone" label="Teléfono" value={values.customerPhone ?? ""} error={errors.customerPhone} disabled={isPending} required onChange={(value) => updateField("customerPhone", value)} />
                </div>
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <OptionCombobox
                id="vehicle-brand"
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
              <TextField
                id="vehicle-model"
                label="Modelo / referencia"
                value={values.modelReference}
                error={errors.modelReference}
                disabled={isPending}
                required
                onChange={(value) => updateField("modelReference", value)}
              />
              <TextField
                id="vehicle-plate"
                label="Placa"
                value={values.plate}
                error={errors.plate}
                disabled={isPending}
                required
                onChange={(value) => updateField("plate", value)}
              />
            </div>
            <RichTextField
              id="vehicle-notes"
              label="Notas"
              value={values.notes}
              error={errors.notes}
              disabled={isPending}
              onChange={(value) => updateField("notes", value)}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => setOpen(false)}
          >
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
      <Input
        id={id}
        value={value}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldError errors={[{ message: error }]} />
    </Field>
  );
}

function getInitialValues(
  vehicle?: Vehicle,
  initialCustomerId?: string,
): VehicleFormInput {
  if (!vehicle)
    return { ...emptyVehicleFormValues, customerId: initialCustomerId ?? "" };

  return {
    customerId: vehicle.customerId,
    customerName: "",
    customerDocumentType: "NIT",
    customerDocumentNumber: "",
    customerPhone: "",
    brandId: "",
    brand: vehicle.brand,
    modelReference: vehicle.modelReference,
    plate: vehicle.plate,
    notes: vehicle.notes,
  };
}

export function buildVehicleCreatePayload(values: VehicleFormInput): VehicleFormPayload {
  const payload: VehicleFormPayload = {
    modelReference: values.modelReference,
    plate: values.plate,
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
