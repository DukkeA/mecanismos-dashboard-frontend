import { z } from "zod";

import { CUSTOMER_STATUSES } from "@/lib/customers/types";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

export const customerFormSchema = z.object({
  name: z.string().trim().min(2, "Ingresá el nombre del cliente."),
  documentNumber: z.string().trim().min(3, "Ingresá un documento válido."),
  email: optionalText.pipe(z.email("Ingresá un email válido.").optional()),
  phone: optionalText,
  address: optionalText,
  status: z.enum(CUSTOMER_STATUSES).default("active"),
});

export const customerCreateSchema = customerFormSchema;
export const customerUpdateSchema = customerFormSchema;

export type CustomerFormInput = z.input<typeof customerFormSchema>;
export type CustomerFormOutput = z.output<typeof customerFormSchema>;

export const emptyCustomerFormValues: CustomerFormInput = {
  name: "",
  documentNumber: "",
  email: "",
  phone: "",
  address: "",
  status: "active",
};
