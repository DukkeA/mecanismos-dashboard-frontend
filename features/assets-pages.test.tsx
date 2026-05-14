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
import { VehiclesPage } from "@/features/vehicles/vehicles-page";
import type { WorkshopComponent } from "@/lib/components/types";

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
    if (url.includes("/component-types/options")) return Response.json(componentTypeOptionsResponse);
    if (url.includes("/vehicles/options")) return Response.json(vehicleOptionsResponse);
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

    expect((await screen.findAllByText("AA123BB"))[0]).toBeVisible();
    await userEvent.type(screen.getByLabelText("Buscar vehículos"), "volvo");

    await waitFor(() => expect(String(fetchMock.mock.lastCall?.[0])).toContain("search=volvo"));
    expect(String(fetchMock.mock.lastCall?.[0])).not.toMatch(/sort(By|Dir)/);
  });

  it("covers vehicle loading, empty, and retryable error states", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => undefined)));

    const { unmount } = renderWithQuery(<VehiclesPage />);

    expect(screen.getByRole("status", { name: "Cargando vehículos" })).toBeVisible();
    unmount();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }),
      ),
    );
    const emptyRender = renderWithQuery(<VehiclesPage />);

    expect(await screen.findByText("No hay vehículos para mostrar")).toBeVisible();
    expect(screen.getByRole("button", { name: "Crear vehículo" })).toBeVisible();
    emptyRender.unmount();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ message: "Failed" }, { status: 500 }))
      .mockResolvedValueOnce(
        Response.json({
          data: [{ id: "v2", customerId: "c1", plate: "BB234CC", brand: "Scania", modelReference: "R" }],
          meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    renderWithQuery(<VehiclesPage />);

    expect(await screen.findByText("No pudimos cargar los vehículos")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findAllByText("BB234CC")).toHaveLength(2);
  });

  it("renders vehicle detail with customer link", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ id: "v1", customerId: "c1", plate: "AA123BB", brand: "Volvo", modelReference: "FH" }),
      ),
    );

    renderWithQuery(<VehicleDetailPage vehicleId="v1" />);

    expect(await screen.findByText("AA123BB")).toBeVisible();
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
    await userEvent.type(within(dialog).getByLabelText("Patente"), "aa123bb");

    fireEvent.submit(document.getElementById("vehicle-form") as HTMLFormElement);

    expect(await screen.findByText("No pudimos guardar el vehículo")).toBeVisible();
    expect(toast.error).toHaveBeenCalledWith("Revisá los datos del vehículo y volvé a intentar.");
    expect(within(screen.getByRole("dialog")).getByLabelText("Marca")).toHaveValue("Volvo");
    expect(within(screen.getByRole("dialog")).getByLabelText("Modelo / referencia")).toHaveValue("FH");
    expect(within(screen.getByRole("dialog")).getByLabelText("Patente")).toHaveValue("aa123bb");
  });

  it("disables vehicle form submit while pending and shows success toast", async () => {
    let resolveCreate: (response: Response) => void = () => undefined;
    const createResponse = new Promise<Response>((resolve) => {
      resolveCreate = resolve;
    });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(createResponse));

    renderWithQuery(
      <VehicleFormDialog initialCustomerId="c1" trigger={<button type="button">Nuevo vehículo</button>} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Nuevo vehículo" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Marca"), "Volvo");
    await userEvent.type(within(dialog).getByLabelText("Modelo / referencia"), "FH");
    await userEvent.type(within(dialog).getByLabelText("Patente"), "AA123BB");

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

  it("renders component detail with customer and optional vehicle links", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ id: "p1", customerId: "c1", vehicleId: "v1", componentTypeId: "ct1", brand: "Bosch", reference: "ALT", identifier: "ALT-90", componentType: { id: "ct1", name: "Alternador" } }),
      ),
    );

    renderWithQuery(<ComponentDetailPage componentId="p1" />);

    expect(await screen.findByText("ALT-90")).toBeVisible();
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
    await userEvent.click(within(dialog).getByLabelText("Tipo"));
    await userEvent.click(await screen.findByRole("option", { name: "Alternador" }));
    await userEvent.click(within(dialog).getByLabelText("Vehículo opcional"));
    fireEvent.click(await screen.findByText("AA123BB"));
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
      brand: "Bosch",
      reference: "ALT",
      identifier: "ALT-90",
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

  it("preserves component data and announces boundary feedback when unlink submission fails", async () => {
    const component: WorkshopComponent = {
      id: "p1",
      customerId: "c1",
      vehicleId: "v1",
      componentTypeId: "ct1",
      brand: "Bosch",
      reference: "ALT",
      identifier: "ALT-90",
      notes: "Original note",
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
      notes: "Original note",
    });
    expect(within(screen.getByRole("dialog")).getByLabelText("Marca")).toHaveValue("Bosch");
    expect(within(screen.getByRole("dialog")).getByLabelText("Referencia")).toHaveValue("ALT");
    expect(within(screen.getByRole("dialog")).getByLabelText("Identificador")).toHaveValue("ALT-90");
    expect(within(screen.getByRole("dialog")).getByLabelText("Notas")).toHaveValue("Original note");
    expect(toast.error).toHaveBeenCalledWith("Revisá que el vehículo pertenezca al mismo cliente e intentá otra vez.");
  });
});
