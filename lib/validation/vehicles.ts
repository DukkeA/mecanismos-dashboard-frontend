import { z } from "zod";

import { richTextNoteSchema } from "@/lib/rich-text";

export const vehicleFormSchema = z.object({
  customerId: z.string().trim().min(1, "Seleccioná un cliente."),
  brand: z.string().trim().min(2, "Ingresá la marca."),
  modelReference: z.string().trim().min(2, "Ingresá el modelo o referencia."),
  plate: z
    .string()
    .trim()
    .min(3, "Ingresá una placa válida.")
    .transform((value) => value.toUpperCase()),
  notes: richTextNoteSchema.optional().default(null),
});

export const vehicleCreateSchema = vehicleFormSchema;
export const vehicleUpdateSchema = vehicleFormSchema.omit({ customerId: true });

export type VehicleFormInput = z.output<typeof vehicleFormSchema>;
export type VehicleFormOutput = z.output<typeof vehicleFormSchema>;
export type VehicleUpdateInput = z.output<typeof vehicleUpdateSchema>;

export const emptyVehicleFormValues: VehicleFormInput = {
  customerId: "",
  brand: "",
  modelReference: "",
  plate: "",
  notes: null,
};
