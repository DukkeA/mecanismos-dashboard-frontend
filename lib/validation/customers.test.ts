import { describe, expect, it } from "vitest";

import { customerCreateSchema, customerUpdateSchema } from "@/lib/validation/customers";

describe("customer validation schemas", () => {
  it("normalizes optional fields and defaults active status", () => {
    expect(
      customerCreateSchema.parse({
        name: "  Transporte Austral ",
        documentNumber: "  30-12345678-9 ",
        email: "  ",
        phone: "  291 555-0101 ",
        documentType: "NIT",
      }),
    ).toEqual({
      name: "Transporte Austral",
      documentType: "NIT",
      documentNumber: "30-12345678-9",
      email: undefined,
      phone: "291 555-0101",
      notes: null,
      status: "active",
    });
  });

  it("returns accessible Spanish validation messages", () => {
    const result = customerUpdateSchema.safeParse({
      name: "A",
      documentNumber: "1",
      documentType: "CEDULA",
      email: "bad-email",
      status: "active",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.name?.[0]).toBe(
      "Ingresá el nombre del cliente.",
    );
    expect(result.error?.flatten().fieldErrors.documentNumber?.[0]).toBe(
      "Ingresá un documento válido.",
    );
    expect(result.error?.flatten().fieldErrors.email?.[0]).toBe(
      "Ingresá un email válido.",
    );
  });

  it("accepts only the backend customer document type enum values", () => {
    expect(customerCreateSchema.shape.documentType.safeParse("CEDULA").success).toBe(true);
    expect(customerCreateSchema.shape.documentType.safeParse("NIT").success).toBe(true);
    expect(customerCreateSchema.shape.documentType.safeParse("CUIT").success).toBe(false);
    expect(customerCreateSchema.shape.documentType.safeParse("DNI").success).toBe(false);
  });
});
