import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ComponentDetailPage } from "@/features/components/component-detail-page";
import { ComponentFormDialog } from "@/features/components/component-form-dialog";
import { ComponentsPage } from "@/features/components/components-page";
import { ComponentsTable } from "@/features/components/components-table";
import { VehicleFormDialog } from "@/features/vehicles/vehicle-form-dialog";
import { VehicleDetailPage } from "@/features/vehicles/vehicle-detail-page";
import { VehiclesTable } from "@/features/vehicles/vehicles-table";
import { VehiclesPage } from "@/features/vehicles/vehicles-page";
import type { WorkshopComponent } from "@/lib/components/types";
import type { Vehicle } from "@/lib/vehicles/types";
import { legacyStringToRichTextNote } from "@/lib/rich-text";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function renderWithQuery(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const result = render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);

  return { ...result, queryClient };
}

const componentTypeOptionsResponse = {
  data: [{ id: "ct1", label: "Alternador", description: null }],
};

const vehicleOptionsResponse = {
  data: [{ id: "v1", label: "AA123BB", description: "Volvo FH" }],
};

const brandOptionsResponse = {
  data: [
    { id: "br-volvo", label: "Volvo", description: null },
    { id: "br-bosch", label: "Bosch", description: null },
  ],
};

const componentResponse = {
  id: "p1",
  customerId: "c1",
  vehicleId: "v1",
  componentTypeId: "ct1",
  brand: "Bosch",
  reference: "ALT",
  identifier: "ALT-90",
  notes: "Original note",
  componentType: { id: "ct1", name: "Alternador" },
};

function mockComponentFormFetch(postResponse: Response | Promise<Response>) {
  return vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    if (url.includes("/customers/options")) return Response.json({ data: [{ id: "c1", label: "Cliente Uno", description: "30-1" }] });
    if (url.includes("/component-types/options")) return Response.json(componentTypeOptionsResponse);
    if (url.includes("/vehicles/options")) return Response.json(vehicleOptionsResponse);
    if (url.includes("/brands/options")) return Response.json(brandOptionsResponse);
    if (url.endsWith("/components") && init?.method === "POST") return postResponse;
    return Response.json({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } });
  });
}

describe("asset list and detail pages", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://backend.example.test";
    Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", { configurable: true, value: () => false });
    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", { configurable: true, value: () => undefined });
    Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", { configurable: true, value: () => undefined });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: () => undefined });
    vi.clearAllMocks();
  });

  it("renders vehicles list and searches without sort params", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        data: [{ id: "v1", customerId: "c1", plate: "AA123BB", brand: "Volvo", modelReference: "FH" }],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderWithQuery(<VehiclesPage />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await userEvent.type(screen.getByLabelText("Buscar vehículos"), "volvo");

    await waitFor(() => expect(String(fetchMock.mock.lastCall?.[0])).toContain("search=volvo"));
    expect(String(fetchMock.mock.lastCall?.[0])).not.toMatch(/sort(By|Dir)/);

    renderWithQuery(<VehiclesTable params={{ page: 1, limit: 10 }} page={{ data: [vehicleRow("v1", "AA123BB", null)], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } }} isPending={false} isError={false} onRetry={vi.fn()} onParamsChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Placa: ordenamiento no disponible" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Placa: ordenamiento no disponible")).toBeVisible();
  });

  it("covers vehicle loading, empty, and retryable error states", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => undefined)));

    const { unmount } = renderWithQuery(<VehiclesPage />);

    expect(screen.getByRole("status", { name: "Cargando vehículos" })).toBeVisible();
    unmount();

    const emptyRender = renderWithQuery(<VehiclesTable params={{ page: 1, limit: 10 }} page={{ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }} isPending={false} isError={false} onRetry={vi.fn()} onParamsChange={vi.fn()} />);

    expect(await screen.findByText("No hay vehículos para mostrar")).toBeVisible();
    expect(screen.getByRole("button", { name: "Crear vehículo" })).toBeVisible();
    emptyRender.unmount();

    const onRetry = vi.fn();
    renderWithQuery(<VehiclesTable params={{ page: 1, limit: 10 }} isPending={false} isError onRetry={onRetry} onParamsChange={vi.fn()} />);

    expect(screen.getByText("No pudimos cargar los vehículos")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders vehicle detail with customer link", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ id: "v1", customerId: "c1", plate: "AA123BB", brand: "Volvo", modelReference: "FH", notes: legacyStringToRichTextNote("Vehicle JSON detail note") }),
      ),
    );

    renderWithQuery(<VehicleDetailPage vehicleId="v1" />);

    expect(await screen.findByText("AA123BB")).toBeVisible();
    expect(screen.getByText("Vehicle JSON detail note")).toBeVisible();
    expect(screen.getByRole("link", { name: "c1" })).toHaveAttribute("href", "/customers/c1");
  });

  it("shows safe vehicle detail navigation when the vehicle is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "Not found" }, { status: 404 })),
    );

    renderWithQuery(<VehicleDetailPage vehicleId="missing" />);

    expect(await screen.findByText("No pudimos cargar el vehículo")).toBeVisible();
    expect(screen.getByRole("link", { name: "Volver a vehículos" })).toHaveAttribute(
      "href",
      "/vehicles",
    );
  });

  it("keeps vehicle dialog data after validation and server failures", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ message: "Duplicate plate" }, { status: 409 }));
    vi.stubGlobal("fetch", fetchMock);

    renderWithQuery(
      <VehicleFormDialog initialCustomerId="c1" trigger={<button type="button">Nuevo vehículo</button>} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Nuevo vehículo" }));
    await userEvent.click(screen.getByRole("button", { name: "Crear vehículo" }));

    expect(await screen.findByText("Ingresá la marca.")).toBeVisible();

    const dialog = screen.getByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Marca"), "Volvo");
    await userEvent.type(within(dialog).getByLabelText("Modelo / referencia"), "FH");
    await userEvent.type(within(dialog).getByLabelText("Placa"), "aa123bb");

    fireEvent.submit(document.getElementById("vehicle-form") as HTMLFormElement);

    expect(await screen.findByText("No pudimos guardar el vehículo")).toBeVisible();
    const postCall = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith("/vehicles") && init?.method === "POST");
    expect(JSON.parse(String(postCall?.[1]?.body))).toMatchObject({ notes: null });
    expect(toast.error).toHaveBeenCalledWith("Revisá los datos del vehículo y volvé a intentar.");
    expect(within(screen.getByRole("dialog")).getByLabelText("Marca")).toHaveValue("Volvo");
    expect(within(screen.getByRole("dialog")).getByLabelText("Modelo / referencia")).toHaveValue("FH");
    expect(within(screen.getByRole("dialog")).getByLabelText("Placa")).toHaveValue("aa123bb");
  });

  it("creates vehicles from fetched customer options without unsupported fields", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes("/customers/options")) {
        return Response.json({ data: [{ id: "c1", label: "Cliente Uno", description: "30-1" }] });
      }
      if (url.includes("/brands/options")) return Response.json(brandOptionsResponse);
      if (url.endsWith("/vehicles") && init?.method === "POST") {
        return Response.json({ id: "v1", customerId: "c1", plate: "AA123BB", brand: "Volvo", modelReference: "FH" });
      }
      return Response.json({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithQuery(<VehicleFormDialog trigger={<button type="button">Nuevo vehículo</button>} />);

    await userEvent.click(screen.getByRole("button", { name: "Nuevo vehículo" }));
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/customers/options"))).toBe(true));
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/brands/options"))).toBe(true));
    await userEvent.type(within(dialog).getByLabelText("Cliente"), "Cliente Uno");
    await userEvent.type(within(dialog).getByLabelText("Marca"), "Volvo");
    await userEvent.type(within(dialog).getByLabelText("Modelo / referencia"), "FH");
    await userEvent.type(within(dialog).getByLabelText("Placa"), "AA123BB");

    fireEvent.submit(document.getElementById("vehicle-form") as HTMLFormElement);

    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/customers/options"))).toBe(true));
    const postCall = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith("/vehicles") && init?.method === "POST");
    const body = JSON.parse(String(postCall?.[1]?.body));
    expect(body).toMatchObject({ customerId: "c1", brandId: "br-volvo", plate: "AA123BB" });
    expect(body).not.toHaveProperty("brandName");
    expect(body).not.toHaveProperty("sortBy");
  });

  it("disables vehicle form submit while pending and shows success toast", async () => {
    let resolveCreate: (response: Response) => void = () => undefined;
    const createResponse = new Promise<Response>((resolve) => {
      resolveCreate = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes("/brands/options")) return Response.json(brandOptionsResponse);
        if (url.endsWith("/vehicles") && init?.method === "POST") return createResponse;
        return Response.json({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } });
      }),
    );

    renderWithQuery(
      <VehicleFormDialog initialCustomerId="c1" trigger={<button type="button">Nuevo vehículo</button>} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Nuevo vehículo" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Marca"), "Volvo");
    await userEvent.type(within(dialog).getByLabelText("Modelo / referencia"), "FH");
    await userEvent.type(within(dialog).getByLabelText("Placa"), "AA123BB");

    fireEvent.submit(document.getElementById("vehicle-form") as HTMLFormElement);

    await waitFor(() => expect(within(screen.getByRole("dialog")).getByLabelText("Marca")).toBeDisabled());

    resolveCreate(
      Response.json({ id: "v9", customerId: "c1", plate: "AA123BB", brand: "Volvo", modelReference: "FH" }),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(toast.success).toHaveBeenCalledWith("Vehículo creado.");
  });

  it("renders components list and type filter without sort params", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/component-types/options")) {
        return Response.json({ data: [{ id: "ct1", label: "Alternador", description: null }] });
      }
      return Response.json({
        data: [{ id: "p1", customerId: "c1", componentTypeId: "ct1", brand: "Bosch", reference: "ALT", identifier: "ALT-90", componentType: { id: "ct1", name: "Alternador" } }],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithQuery(<ComponentsPage />);

    expect(await screen.findAllByText("ALT-90")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Componente: ordenamiento no disponible" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Componente: ordenamiento no disponible")).toBeVisible();
    await userEvent.type(screen.getByLabelText("Buscar componentes"), "alt");

    await waitFor(() => expect(String(fetchMock.mock.lastCall?.[0])).toContain("/components?"));
    expect(fetchMock.mock.calls.map(([url]) => String(url)).join("\n")).not.toMatch(/sort(By|Dir)/);
  });

  it("covers component loading, empty, and retryable error states", async () => {
    const params = { page: 1, limit: 10, search: "" };
    const onParamsChange = vi.fn();
    const onRetry = vi.fn();

    const { unmount } = renderWithQuery(
      <ComponentsTable
        params={params}
        isPending
        isError={false}
        onRetry={onRetry}
        onParamsChange={onParamsChange}
      />,
    );

    expect(screen.getByRole("status", { name: "Cargando componentes" })).toBeVisible();
    unmount();

    const emptyRender = renderWithQuery(
      <ComponentsTable
        params={params}
        page={{ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }}
        isPending={false}
        isError={false}
        onRetry={onRetry}
        onParamsChange={onParamsChange}
      />,
    );

    expect(screen.getByText("No hay componentes para mostrar")).toBeVisible();
    expect(screen.getByRole("button", { name: "Crear componente" })).toBeVisible();
    emptyRender.unmount();

    renderWithQuery(
      <ComponentsTable
        params={params}
        isPending={false}
        isError
        onRetry={onRetry}
        onParamsChange={onParamsChange}
      />,
    );

    expect(screen.getByText("No pudimos cargar los componentes")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders vehicle table and mobile previews from JSON, legacy, long, and unknown notes", () => {
    const longText = "This vehicle note is intentionally long so the compact preview truncates it before it overwhelms the table layout.";

    renderWithQuery(<VehiclesTable params={{ page: 1, limit: 10 }} page={{ data: [vehicleRow("v-json", "AA111AA", legacyStringToRichTextNote("Vehicle JSON preview")), vehicleRow("v-legacy", "BB222BB", "Vehicle legacy preview" as never), vehicleRow("v-long", "CC333CC", legacyStringToRichTextNote(longText)), vehicleRow("v-unknown", "DD444DD", { root: { type: "root", children: [{ type: "unknown", children: [{ type: "text", text: "Vehicle unknown note" }] }] } } as never)], meta: { page: 1, limit: 10, total: 4, totalPages: 1 } }} isPending={false} isError={false} onRetry={vi.fn()} onParamsChange={vi.fn()} />);

    expect(screen.getAllByText("Vehicle JSON preview").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Vehicle legacy preview").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Vehicle unknown note").length).toBeGreaterThan(0);
    expect(screen.getAllByText((content) => content.startsWith("This vehicle note is intentionally long") && content.endsWith("…")).length).toBeGreaterThan(0);
  });

  it("renders component table and mobile previews from JSON, legacy, long, and unknown notes", () => {
    const longText = "This component note is intentionally long so the compact preview truncates it before it overwhelms the table layout.";

    renderWithQuery(<ComponentsTable params={{ page: 1, limit: 10 }} page={{ data: [componentRow("p-json", "ALT-1", legacyStringToRichTextNote("Component JSON preview")), componentRow("p-legacy", "ALT-2", "Component legacy preview" as never), componentRow("p-long", "ALT-3", legacyStringToRichTextNote(longText)), componentRow("p-unknown", "ALT-4", { root: { type: "root", children: [{ type: "unknown", children: [{ type: "text", text: "Component unknown note" }] }] } } as never)], meta: { page: 1, limit: 10, total: 4, totalPages: 1 } }} isPending={false} isError={false} onRetry={vi.fn()} onParamsChange={vi.fn()} />);

    expect(screen.getAllByText("Component JSON preview").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Component legacy preview").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Component unknown note").length).toBeGreaterThan(0);
    expect(screen.getAllByText((content) => content.startsWith("This component note is intentionally long") && content.endsWith("…")).length).toBeGreaterThan(0);
  });

  it("renders component detail with customer and optional vehicle links", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ id: "p1", customerId: "c1", vehicleId: "v1", componentTypeId: "ct1", brand: "Bosch", reference: "ALT", identifier: "ALT-90", notes: legacyStringToRichTextNote("Component JSON detail note"), componentType: { id: "ct1", name: "Alternador" } }),
      ),
    );

    renderWithQuery(<ComponentDetailPage componentId="p1" />);

    expect(await screen.findByText("ALT-90")).toBeVisible();
    expect(screen.getByText("Component JSON detail note")).toBeVisible();
    expect(screen.getByRole("link", { name: "c1" })).toHaveAttribute("href", "/customers/c1");
    expect(screen.getByRole("link", { name: "v1" })).toHaveAttribute("href", "/vehicles/v1");
  });

  it("creates a component with type selection, optional vehicle link, pending state, toast, and cache refresh", async () => {
    let resolveCreate: (response: Response) => void = () => undefined;
    const createResponse = new Promise<Response>((resolve) => {
      resolveCreate = resolve;
    });
    const fetchMock = mockComponentFormFetch(createResponse);
    vi.stubGlobal("fetch", fetchMock);

    const { queryClient } = renderWithQuery(
      <ComponentFormDialog initialCustomerId="c1" trigger={<button type="button">Nuevo componente</button>} />,
    );
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    await userEvent.click(screen.getByRole("button", { name: "Nuevo componente" }));
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/component-types/options"))).toBe(true));
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/vehicles/options"))).toBe(true));
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/brands/options"))).toBe(true));
    await userEvent.type(within(dialog).getByLabelText("Tipo"), "Alternador");
    await userEvent.type(within(dialog).getByLabelText("Vehículo opcional"), "AA123BB");
    await userEvent.type(within(dialog).getByLabelText("Marca"), "Bosch");
    await userEvent.type(within(dialog).getByLabelText("Referencia"), "ALT");
    await userEvent.type(within(dialog).getByLabelText("Identificador"), "ALT-90");

    fireEvent.submit(document.getElementById("component-form") as HTMLFormElement);

    await waitFor(() => expect(within(screen.getByRole("dialog")).getByLabelText("Marca")).toBeDisabled());
    const postCall = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith("/components") && init?.method === "POST");
    expect(JSON.parse(String(postCall?.[1]?.body))).toMatchObject({
      customerId: "c1",
      componentTypeId: "ct1",
      vehicleId: "v1",
      brandId: "br-bosch",
      reference: "ALT",
      identifier: "ALT-90",
      notes: null,
    });

    resolveCreate(Response.json(componentResponse));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(toast.success).toHaveBeenCalledWith("Componente creado.");
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["components", "list"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["components", "options"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["component-types", "options"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["customers", "detail", "c1"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["vehicles", "detail", "v1"] });
  });

  it("clears a previously selected vehicle and scopes vehicle options when component customer changes", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const requestUrl = new URL(url, "https://backend.example.test");
      if (requestUrl.pathname.endsWith("/customers/options")) {
        return Response.json({
          data: [
            { id: "c1", label: "Cliente Uno", description: "30-1" },
            { id: "c2", label: "Cliente Dos", description: "30-2" },
          ],
        });
      }
      if (requestUrl.pathname.endsWith("/component-types/options")) return Response.json(componentTypeOptionsResponse);
      if (requestUrl.pathname.endsWith("/brands/options")) return Response.json(brandOptionsResponse);
      if (requestUrl.pathname.endsWith("/vehicles/options")) {
        const customerId = requestUrl.searchParams.get("customerId");
        return Response.json({
          data:
            customerId === "c1"
              ? [{ id: "v1", label: "AA123BB", description: "Volvo FH" }]
              : [{ id: "v2", label: "BB234CC", description: "Scania R" }],
        });
      }
      if (url.endsWith("/components") && init?.method === "POST") return Response.json(componentResponse);
      return Response.json({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithQuery(<ComponentFormDialog trigger={<button type="button">Nuevo componente</button>} />);

    await userEvent.click(screen.getByRole("button", { name: "Nuevo componente" }));
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/customers/options"))).toBe(true));
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/component-types/options"))).toBe(true));
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/brands/options"))).toBe(true));
    await userEvent.type(within(dialog).getByLabelText("Cliente"), "Cliente Uno");
    await userEvent.type(within(dialog).getByLabelText("Tipo"), "Alternador");
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/vehicles/options") && String(url).includes("customerId=c1"))).toBe(true));
    await userEvent.type(within(dialog).getByLabelText("Vehículo opcional"), "AA123BB");

    await userEvent.clear(within(dialog).getByLabelText("Cliente"));
    await userEvent.type(within(dialog).getByLabelText("Cliente"), "Cliente Dos");

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([url]) => {
          const requestUrl = new URL(String(url), "https://backend.example.test");
          return requestUrl.pathname.endsWith("/vehicles/options") && requestUrl.searchParams.get("customerId") === "c2";
        }),
      ).toBe(true),
    );
    expect(within(dialog).getByLabelText("Vehículo opcional")).toHaveValue("");

    await userEvent.type(within(dialog).getByLabelText("Marca"), "Bosch");
    await userEvent.type(within(dialog).getByLabelText("Referencia"), "ALT");
    await userEvent.type(within(dialog).getByLabelText("Identificador"), "ALT-90");
    fireEvent.submit(document.getElementById("component-form") as HTMLFormElement);

    await waitFor(() => expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith("/components") && init?.method === "POST")).toBe(true));
    const postCall = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith("/components") && init?.method === "POST");
    const body = JSON.parse(String(postCall?.[1]?.body));
    expect(body).toMatchObject({ customerId: "c2", componentTypeId: "ct1" });
    expect(body).not.toHaveProperty("vehicleId");
  });

  it("announces loading and empty states for assignment option comboboxes", async () => {
    let resolveCustomers: (response: Response) => void = () => undefined;
    let resolveVehicles: (response: Response) => void = () => undefined;
    const customersResponse = new Promise<Response>((resolve) => {
      resolveCustomers = resolve;
    });
    const vehiclesResponse = new Promise<Response>((resolve) => {
      resolveVehicles = resolve;
    });
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/customers/options")) return customersResponse;
      if (url.includes("/vehicles/options")) return vehiclesResponse;
      if (url.includes("/component-types/options")) return Response.json(componentTypeOptionsResponse);
      return Response.json({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = renderWithQuery(<ComponentFormDialog trigger={<button type="button">Nuevo componente</button>} />);
    await userEvent.click(screen.getByRole("button", { name: "Nuevo componente" }));

    expect(await screen.findByRole("status", { name: "Cargando cliente" })).toBeVisible();
    resolveCustomers(Response.json({ data: [] }));
    resolveVehicles(Response.json({ data: [] }));
    await userEvent.click(within(await screen.findByRole("dialog")).getByLabelText("Cliente"));
    expect(await screen.findByText("No encontramos clientes.")).toBeVisible();
    unmount();

    const vehicleFetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/vehicles/options")) return new Promise<Response>(() => undefined);
      if (url.includes("/component-types/options")) return Response.json(componentTypeOptionsResponse);
      return Response.json({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } });
    });
    vi.stubGlobal("fetch", vehicleFetchMock);

    const pendingVehicleRender = renderWithQuery(
      <ComponentFormDialog initialCustomerId="c1" trigger={<button type="button">Nuevo componente</button>} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Nuevo componente" }));
    expect(await screen.findByRole("status", { name: "Cargando vehículo opcional" })).toBeVisible();
    pendingVehicleRender.unmount();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("/vehicles/options")) return Response.json({ data: [] });
        if (url.includes("/component-types/options")) return Response.json(componentTypeOptionsResponse);
        return Response.json({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } });
      }),
    );
    renderWithQuery(<ComponentFormDialog initialCustomerId="c1" trigger={<button type="button">Nuevo componente</button>} />);
    await userEvent.click(screen.getByRole("button", { name: "Nuevo componente" }));
    await userEvent.click(within(await screen.findByRole("dialog")).getByLabelText("Vehículo opcional"));
    expect(await screen.findByText("No encontramos vehículos para este cliente.")).toBeVisible();
  });

  it("preserves component data and announces boundary feedback when unlink submission fails", async () => {
    const component: WorkshopComponent = {
      id: "p1",
      customerId: "c1",
      vehicleId: "v1",
      componentTypeId: "ct1",
      brand: "Bosch",
      reference: "ALT",
      identifier: "ALT-90",
      notes: { root: { type: "root", children: [{ type: "paragraph", children: [{ type: "text", text: "Original note" }] }] } },
      createdAt: null,
      updatedAt: null,
      componentType: {
        id: "ct1",
        name: "Alternador",
        slug: "alternador",
        description: null,
        isActive: true,
        createdAt: null,
        updatedAt: null,
      },
    };
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes("/component-types/options")) return Response.json(componentTypeOptionsResponse);
      if (url.includes("/customers/options")) return Response.json({ data: [{ id: "c1", label: "Cliente Uno", description: "30-1" }] });
      if (url.includes("/vehicles/options")) return Response.json(vehicleOptionsResponse);
      if (url.endsWith("/components/p1") && init?.method === "PATCH") {
        return Response.json({ message: "Vehicle belongs to another customer" }, { status: 409 });
      }
      return Response.json({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithQuery(
      <ComponentFormDialog component={component} trigger={<button type="button">Editar componente</button>} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Editar componente" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Quitar vínculo con vehículo" }));

    fireEvent.submit(document.getElementById("component-form") as HTMLFormElement);

    expect(await screen.findByText("No pudimos guardar el componente")).toBeVisible();
    expect(screen.getByText("No pudimos guardar el componente. Revisá que el vehículo pertenezca al mismo cliente e intentá otra vez.")).toBeVisible();
    const patchCall = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith("/components/p1") && init?.method === "PATCH");
    expect(JSON.parse(String(patchCall?.[1]?.body))).toMatchObject({
      componentTypeId: "ct1",
      vehicleId: null,
      brand: "Bosch",
      reference: "ALT",
      identifier: "ALT-90",
      notes: expect.objectContaining({ root: expect.objectContaining({ type: "root" }) }),
    });
    expect(within(screen.getByRole("dialog")).getByLabelText("Marca")).toHaveValue("Bosch");
    expect(within(screen.getByRole("dialog")).getByLabelText("Referencia")).toHaveValue("ALT");
    expect(within(screen.getByRole("dialog")).getByLabelText("Identificador")).toHaveValue("ALT-90");
    expect(within(screen.getByRole("dialog")).getByText("Original note")).toBeVisible();
    expect(toast.error).toHaveBeenCalledWith("Revisá que el vehículo pertenezca al mismo cliente e intentá otra vez.");
  });
});

function vehicleRow(id: string, plate: string, notes: Vehicle["notes"]): Vehicle {
  return { id, customerId: "c1", plate, brand: "Volvo", modelReference: "FH", notes, createdAt: null, updatedAt: null };
}

function componentRow(id: string, identifier: string, notes: WorkshopComponent["notes"]): WorkshopComponent {
  return { id, customerId: "c1", vehicleId: null, componentTypeId: "ct1", brand: "Bosch", reference: "ALT", identifier, notes, createdAt: null, updatedAt: null, componentType: { id: "ct1", name: "Alternador", slug: "alternador", description: null, isActive: true, createdAt: null, updatedAt: null } };
}
