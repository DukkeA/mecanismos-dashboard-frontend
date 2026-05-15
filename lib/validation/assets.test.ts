import { describe, expect, it } from "vitest";

import { componentCreateSchema, componentUpdateSchema } from "@/lib/validation/components";
import { vehicleCreateSchema, vehicleUpdateSchema } from "@/lib/validation/vehicles";

describe("asset validation schemas", () => {
  it("normalizes vehicle payloads and omits customer reassignment from updates", () => {
    expect(
      vehicleCreateSchema.parse({
        customerId: " c1 ",
        brand: " Volvo ",
        modelReference: " FH ",
        plate: " ab123cd ",
        notes: " ",
      }),
    ).toEqual({
      customerId: "c1",
      brand: "Volvo",
      modelReference: "FH",
      plate: "AB123CD",
      notes: null,
    });

    expect(vehicleUpdateSchema.safeParse({ customerId: "c2" }).success).toBe(false);
  });

  it("keeps component vehicle clearing as null", () => {
    expect(
      componentUpdateSchema.parse({
        componentTypeId: "ct1",
        vehicleId: null,
        brand: " Bosch ",
        reference: " ALT-90 ",
        identifier: " ",
        notes: " ok ",
      }),
    ).toEqual({
      componentTypeId: "ct1",
      vehicleId: null,
      brand: "Bosch",
      reference: "ALT-90",
      identifier: undefined,
      notes: expect.objectContaining({ root: expect.objectContaining({ type: "root" }) }),
    });

    expect(componentCreateSchema.safeParse({ customerId: "", brand: "A" }).success).toBe(false);
  });
});
