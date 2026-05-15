import { describe, expect, it } from "vitest";

import { buildComponentCreatePayload } from "@/features/components/component-form-dialog";
import { buildVehicleCreatePayload } from "@/features/vehicles/vehicle-form-dialog";
import { canonicalizeLookupLabel } from "@/lib/lookups/canonicalize";
import { componentCreateSchema, componentUpdateSchema } from "@/lib/validation/components";
import { vehicleCreateSchema, vehicleUpdateSchema } from "@/lib/validation/vehicles";

describe("asset validation schemas", () => {
  it("normalizes vehicle payloads and omits customer reassignment from updates", () => {
    expect(
      vehicleCreateSchema.parse({
        customerId: " c1 ",
        brandId: " b1 ",
        brand: " Volvo ",
        modelReference: " FH ",
        plate: " ab123cd ",
        notes: " ",
      }),
    ).toEqual({
      customerId: "c1",
      brandId: "b1",
      brand: "Volvo",
      customerDocumentType: "NIT",
      modelReference: "FH",
      plate: "AB123CD",
      notes: null,
    });

    expect(vehicleUpdateSchema.safeParse({ customerId: "c2" }).success).toBe(false);
  });

  it("validates inline customer fields when creating a vehicle without an existing customer", () => {
    const parsed = vehicleCreateSchema.parse({
      customerName: " Transporte Austral ",
      customerDocumentType: "NIT",
      customerDocumentNumber: " 30-12345678-9 ",
      customerPhone: " 291 555-0101 ",
      brand: " Bosch ",
      modelReference: " FH ",
      plate: " ab123cd ",
    });

    expect(buildVehicleCreatePayload(parsed)).toMatchObject({
      customer: {
        name: "Transporte Austral",
        documentType: "NIT",
        documentNumber: "30-12345678-9",
        phone: "291 555-0101",
      },
      brandName: "Bosch",
      modelReference: "FH",
      plate: "AB123CD",
    });
  });

  it("keeps component vehicle clearing as null", () => {
    expect(
      componentUpdateSchema.parse({
        componentTypeId: "ct1",
        vehicleId: null,
        brandId: "brand-1",
        brand: " Bosch ",
        reference: " ALT-90 ",
        identifier: " ",
        notes: " ok ",
      }),
    ).toEqual({
      componentTypeId: "ct1",
      vehicleId: null,
      brandId: "brand-1",
      brand: "Bosch",
      reference: "ALT-90",
      identifier: undefined,
      notes: expect.objectContaining({ root: expect.objectContaining({ type: "root" }) }),
    });

    expect(componentCreateSchema.safeParse({ customerId: "", brand: "A" }).success).toBe(false);
  });

  it("builds component create payloads with inline customer, component type, and brand name", () => {
    const parsed = componentCreateSchema.parse({
      customerName: " Minera Norte ",
      customerDocumentType: "NIT",
      customerDocumentNumber: " 900123 ",
      customerPhone: " +54 11 5555 ",
      componentTypeName: " Alternator ",
      brand: " BoScH ",
      reference: " ALT-90 ",
    });

    expect(buildComponentCreatePayload(parsed)).toMatchObject({
      customer: {
        name: "Minera Norte",
        documentNumber: "900123",
        phone: "+54 11 5555",
      },
      componentType: { name: "Alternator" },
      brandName: "BoScH",
      reference: "ALT-90",
    });
  });

  it("uses existing brand and component type ids when normalized labels match", () => {
    expect(canonicalizeLookupLabel("  BoScH  ")).toBe(
      canonicalizeLookupLabel("bosch"),
    );

    const parsed = componentCreateSchema.parse({
      customerId: "customer-1",
      componentTypeId: "type-1",
      brandId: "brand-1",
      brand: "BOSCH",
      reference: "ALT-90",
    });

    expect(buildComponentCreatePayload(parsed)).toMatchObject({
      customerId: "customer-1",
      componentTypeId: "type-1",
      brandId: "brand-1",
    });
  });
});
