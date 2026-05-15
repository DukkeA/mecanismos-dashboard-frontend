"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { RichTextField } from "@/components/rich-text/rich-text-field";
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
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
} from "@/hooks/use-customers";
import type { Customer, CustomerDocumentType, CustomerFormPayload, CustomerStatus } from "@/lib/customers/types";
import {
  customerFormSchema,
  emptyCustomerFormValues,
  type CustomerFormInput,
} from "@/lib/validation/customers";

type FieldErrors = Partial<Record<keyof CustomerFormInput, string>>;

type Props = {
  customer?: Customer;
  trigger: React.ReactNode;
};

export function CustomerFormDialog({ customer, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<CustomerFormInput>(() => getInitialValues(customer));
  const [errors, setErrors] = useState<FieldErrors>({});
  const createMutation = useCreateCustomerMutation();
  const updateMutation = useUpdateCustomerMutation();
  const isEditing = Boolean(customer);
  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setValues(getInitialValues(customer));
      setErrors({});
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = customerFormSchema.safeParse(values);

    if (!parsed.success) {
      setErrors(flattenZodErrors(parsed.error));
      return;
    }

    setErrors({});

    try {
      if (customer) {
        await updateMutation.mutateAsync({ id: customer.id, input: parsed.data });
      } else {
        await createMutation.mutateAsync(parsed.data);
      }
      setOpen(false);
    } catch {
      toast.error("Revisá los datos y volvé a intentar.");
    }
  }

  function updateField<K extends keyof CustomerFormInput>(
    key: K,
    value: CustomerFormInput[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualizá los datos operativos del cliente."
              : "Cargá los datos básicos para comenzar a trabajar con este cliente."}
          </DialogDescription>
        </DialogHeader>
        <form id="customer-form" className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                id="customer-name"
                label="Nombre o razón social"
                value={values.name}
                error={errors.name}
                disabled={isPending}
                onChange={(value) => updateField("name", value)}
              />
              <TextField
                id="customer-document"
                label="Documento / CUIT"
                value={values.documentNumber}
                error={errors.documentNumber}
                disabled={isPending}
                onChange={(value) => updateField("documentNumber", value)}
              />
              <Field data-invalid={Boolean(errors.documentType)} data-disabled={isPending}>
                <FieldLabel htmlFor="customer-document-type">Tipo de documento</FieldLabel>
                <Select
                  value={values.documentType ?? "CUIT"}
                  onValueChange={(value) =>
                    updateField("documentType", value as CustomerDocumentType)
                  }
                  disabled={isPending}
                >
                  <SelectTrigger id="customer-document-type" aria-invalid={Boolean(errors.documentType)}>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="CUIT">CUIT</SelectItem>
                      <SelectItem value="CUIL">CUIL</SelectItem>
                      <SelectItem value="DNI">DNI</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError errors={[{ message: errors.documentType }]} />
              </Field>
              <TextField
                id="customer-email"
                label="Email"
                type="email"
                value={values.email ?? ""}
                error={errors.email}
                disabled={isPending}
                onChange={(value) => updateField("email", value)}
              />
              <TextField
                id="customer-phone"
                label="Teléfono"
                value={values.phone ?? ""}
                error={errors.phone}
                disabled={isPending}
                onChange={(value) => updateField("phone", value)}
              />
              <Field data-invalid={Boolean(errors.status)} data-disabled={isPending}>
                <FieldLabel htmlFor="customer-status">Estado</FieldLabel>
                <Select
                  value={values.status ?? "active"}
                  onValueChange={(value) =>
                    updateField("status", value as CustomerStatus)
                  }
                  disabled={isPending}
                >
                  <SelectTrigger id="customer-status" aria-invalid={Boolean(errors.status)}>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError errors={[{ message: errors.status }]} />
              </Field>
            </div>
            <RichTextField id="customer-notes" label="Notas" value={values.notes} error={errors.notes} disabled={isPending} onChange={(value) => updateField("notes", value)} />
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
          <Button type="submit" form="customer-form" disabled={isPending}>
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            {isEditing ? "Guardar cambios" : "Crear cliente"}
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
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
}) {
  return (
    <Field data-invalid={Boolean(error)} data-disabled={disabled}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldError errors={[{ message: error }]} />
    </Field>
  );
}

function getInitialValues(customer?: Customer): CustomerFormInput {
  if (!customer) return emptyCustomerFormValues;

  return {
    name: customer.name,
    documentType: customer.documentType,
    documentNumber: customer.documentNumber,
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    notes: customer.notes,
    status: customer.status,
  };
}

function flattenZodErrors(error: z.ZodError<CustomerFormPayload>) {
  const fieldErrors = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(fieldErrors).map(([key, value]) => [key, value?.[0]]),
  ) as FieldErrors;
}
