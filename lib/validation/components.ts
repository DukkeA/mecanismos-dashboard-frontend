import { z } from "zod";

import { CUSTOMER_DOCUMENT_TYPES } from "@/lib/customers/types";
import { richTextNoteSchema } from "@/lib/rich-text";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const optionalVehicleId = z
  .union([z.string().trim(), z.null()])
  .optional()
  .transform((value) => {
    if (value === null) return null;
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  });

const baseComponentFormSchema = z.object({
  customerId: optionalText,
  customerName: optionalText,
  customerDocumentType: z.enum(CUSTOMER_DOCUMENT_TYPES).default("NIT"),
  customerDocumentNumber: optionalText,
  customerPhone: optionalText,
  componentTypeId: optionalText,
  componentTypeName: optionalText,
  vehicleId: optionalVehicleId,
  brandId: optionalText,
  brand: z.string().trim().min(2, "Ingresá la marca."),
  reference: z.string().trim().min(2, "Ingresá la referencia."),
  identifier: optionalText,
  notes: richTextNoteSchema.optional().default(null),
});

export const componentFormSchema = baseComponentFormSchema.superRefine((value, ctx) => {
  if (!value.customerId) {
    if (!value.customerName) {
      ctx.addIssue({ code: "custom", path: ["customerName"], message: "Ingresá el nombre del cliente." });
    }
    if (!value.customerDocumentNumber || value.customerDocumentNumber.length < 3) {
      ctx.addIssue({ code: "custom", path: ["customerDocumentNumber"], message: "Ingresá un documento válido." });
    }
    if (!value.customerPhone || value.customerPhone.length < 3) {
      ctx.addIssue({ code: "custom", path: ["customerPhone"], message: "Ingresá un teléfono válido." });
    }
  }

  if (!value.componentTypeId && !value.componentTypeName) {
    ctx.addIssue({ code: "custom", path: ["componentTypeName"], message: "Ingresá un tipo de componente." });
  }
});

export const componentCreateSchema = componentFormSchema;
export const componentUpdateSchema = baseComponentFormSchema.omit({
  customerId: true,
  customerName: true,
  customerDocumentType: true,
  customerDocumentNumber: true,
  customerPhone: true,
});

export type ComponentFormInput = z.output<typeof componentFormSchema>;
export type ComponentFormOutput = z.output<typeof componentFormSchema>;
export type ComponentUpdateInput = z.output<typeof componentUpdateSchema>;

export const emptyComponentFormValues: ComponentFormInput = {
  customerId: "",
  customerName: "",
  customerDocumentType: "NIT",
  customerDocumentNumber: "",
  customerPhone: "",
  componentTypeId: "",
  componentTypeName: "",
  vehicleId: undefined,
  brandId: "",
  brand: "",
  reference: "",
  identifier: "",
  notes: null,
};
