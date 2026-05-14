import { describe, expect, it } from "vitest";

import { buildComponentListSearchParams, buildComponentOptionsSearchParams, mapComponent } from "@/lib/components/types";
import { buildComponentTypeListSearchParams } from "@/lib/component-types/types";
import { buildVehicleListSearchParams, buildVehicleOptionsSearchParams, mapVehicle } from "@/lib/vehicles/types";

describe("asset backend contracts", () => {
  it("builds vehicle query params without unsupported sorting", () => {
    const list = buildVehicleListSearchParams({ page: 2, limit: 20, search: "  abc ", customerId: "c1" });
    const options = buildVehicleOptionsSearchParams({ search: " aa ", limit: 5, customerId: "c1" });

    expect(list).toBe("page=2&limit=20&search=abc&customerId=c1");
    expect(options).toBe("search=aa&limit=5&customerId=c1");
    expect(list).not.toContain("sortBy");
    expect(options).not.toContain("sortDir");
  });

  it("builds component query params without unsupported sorting", () => {
    const list = buildComponentListSearchParams({ page: 1, limit: 10, search: "alt", customerId: "c1", vehicleId: "v1", componentTypeId: "ct1" });
    const options = buildComponentOptionsSearchParams({ limit: 7, customerId: "c1", vehicleId: "v1", componentTypeId: "ct1" });
    const types = buildComponentTypeListSearchParams({ page: 1, limit: 50, search: "motor", isActive: true });

    expect(list).toBe("page=1&limit=10&search=alt&customerId=c1&vehicleId=v1&componentTypeId=ct1");
    expect(options).toBe("limit=7&customerId=c1&vehicleId=v1&componentTypeId=ct1");
    expect(types).toBe("page=1&limit=50&search=motor&isActive=true");
    expect(`${list}&${options}&${types}`).not.toMatch(/sort(By|Dir)/);
  });

  it("normalizes nullable vehicle and component fields", () => {
    expect(mapVehicle({ id: "v1", customerId: "c1", brand: "", modelReference: null, plate: "ABC123", notes: " " })).toMatchObject({
      brand: "Sin marca",
      modelReference: "Sin modelo",
      notes: null,
    });
    expect(mapComponent({ id: "p1", customerId: "c1", vehicleId: null, componentTypeId: "ct1", brand: " Bosch ", reference: " ALT ", identifier: " ", componentType: { id: "ct1", name: "Alternador" } })).toMatchObject({
      vehicleId: null,
      identifier: null,
      componentType: { name: "Alternador" },
    });
  });
});
