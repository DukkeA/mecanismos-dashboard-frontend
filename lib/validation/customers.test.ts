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
        address: " ",
      }),
    ).toEqual({
      name: "Transporte Austral",
      documentNumber: "30-12345678-9",
      email: undefined,
      phone: "291 555-0101",
      address: undefined,
      status: "active",
    });
  });

  it("returns accessible Spanish validation messages", () => {
    const result = customerUpdateSchema.safeParse({
      name: "A",
      documentNumber: "1",
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
});
