import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

export const vehicleFormSchema = z.object({
  customerId: z.string().trim().min(1, "Seleccioná un cliente."),
  brand: z.string().trim().min(2, "Ingresá la marca."),
  modelReference: z.string().trim().min(2, "Ingresá el modelo o referencia."),
  plate: z
    .string()
    .trim()
    .min(3, "Ingresá una patente válida.")
    .transform((value) => value.toUpperCase()),
  notes: optionalText,
});

export const vehicleCreateSchema = vehicleFormSchema;
export const vehicleUpdateSchema = vehicleFormSchema.omit({ customerId: true });

export type VehicleFormInput = z.input<typeof vehicleFormSchema>;
export type VehicleFormOutput = z.output<typeof vehicleFormSchema>;
export type VehicleUpdateInput = z.input<typeof vehicleUpdateSchema>;

export const emptyVehicleFormValues: VehicleFormInput = {
  customerId: "",
  brand: "",
  modelReference: "",
  plate: "",
  notes: "",
};
