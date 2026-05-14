import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const optionalVehicleId = z
  .union([z.string().trim(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null) return null;
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  });

export const componentFormSchema = z.object({
  customerId: z.string().trim().min(1, "Seleccioná un cliente."),
  componentTypeId: z.string().trim().min(1, "Seleccioná un tipo de componente."),
  vehicleId: optionalVehicleId,
  brand: z.string().trim().min(2, "Ingresá la marca."),
  reference: z.string().trim().min(2, "Ingresá la referencia."),
  identifier: optionalText,
  notes: optionalText,
});

export const componentCreateSchema = componentFormSchema;
export const componentUpdateSchema = componentFormSchema.omit({ customerId: true });

export type ComponentFormInput = z.input<typeof componentFormSchema>;
export type ComponentFormOutput = z.output<typeof componentFormSchema>;
export type ComponentUpdateInput = z.input<typeof componentUpdateSchema>;

export const emptyComponentFormValues: ComponentFormInput = {
  customerId: "",
  componentTypeId: "",
  vehicleId: undefined,
  brand: "",
  reference: "",
  identifier: "",
  notes: "",
};
