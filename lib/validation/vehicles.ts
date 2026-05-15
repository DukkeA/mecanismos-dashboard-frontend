import { z } from "zod";

import { CUSTOMER_DOCUMENT_TYPES } from "@/lib/customers/types";
import { richTextNoteSchema } from "@/lib/rich-text";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const baseVehicleFormSchema = z.object({
  customerId: optionalText,
  customerName: optionalText,
  customerDocumentType: z.enum(CUSTOMER_DOCUMENT_TYPES).default("NIT"),
  customerDocumentNumber: optionalText,
  customerPhone: optionalText,
  brandId: optionalText,
  brand: z.string().trim().min(2, "Ingresá la marca."),
  modelReference: z.string().trim().min(2, "Ingresá el modelo o referencia."),
  plate: z
    .string()
    .trim()
    .min(3, "Ingresá una placa válida.")
    .transform((value) => value.toUpperCase()),
  notes: richTextNoteSchema.optional().default(null),
});

export const vehicleFormSchema = baseVehicleFormSchema.superRefine((value, ctx) => {
  if (value.customerId) return;

  if (!value.customerName) {
    ctx.addIssue({ code: "custom", path: ["customerName"], message: "Ingresá el nombre del cliente." });
  }
  if (!value.customerDocumentNumber || value.customerDocumentNumber.length < 3) {
    ctx.addIssue({ code: "custom", path: ["customerDocumentNumber"], message: "Ingresá un documento válido." });
  }
  if (!value.customerPhone || value.customerPhone.length < 3) {
    ctx.addIssue({ code: "custom", path: ["customerPhone"], message: "Ingresá un teléfono válido." });
  }
});

export const vehicleCreateSchema = vehicleFormSchema;
export const vehicleUpdateSchema = baseVehicleFormSchema.omit({
  customerId: true,
  customerName: true,
  customerDocumentType: true,
  customerDocumentNumber: true,
  customerPhone: true,
});

export type VehicleFormInput = z.output<typeof vehicleFormSchema>;
export type VehicleFormOutput = z.output<typeof vehicleFormSchema>;
export type VehicleUpdateInput = z.output<typeof vehicleUpdateSchema>;

export const emptyVehicleFormValues: VehicleFormInput = {
  customerId: "",
  customerName: "",
  customerDocumentType: "NIT",
  customerDocumentNumber: "",
  customerPhone: "",
  brandId: "",
  brand: "",
  modelReference: "",
  plate: "",
  notes: null,
};
