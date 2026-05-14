import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CustomerDetailPage } from "@/features/customers/customer-detail-page";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderWithQuery(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("CustomerDetailPage", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://backend.example.test";
  });

  it("renders customer detail and scoped related asset previews", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/vehicles")) {
        return Response.json({ data: [{ id: "v1", customerId: "c1", plate: "AA123BB", brand: "Volvo", modelReference: "FH" }], meta: { page: 1, limit: 5, total: 1, totalPages: 1 } });
      }
      if (url.includes("/components")) {
        return Response.json({ data: [{ id: "p1", customerId: "c1", componentTypeId: "ct1", brand: "Bosch", reference: "ALT", identifier: "ALT-90", componentType: { id: "ct1", name: "Alternador" } }], meta: { page: 1, limit: 5, total: 1, totalPages: 1 } });
      }
      return Response.json({
        id: "c1",
        name: "Diesel Norte",
        documentNumber: "30-2",
        email: "admin@diesel.test",
        phone: "29155502",
        address: "Ruta 3",
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithQuery(<CustomerDetailPage customerId="c1" />);

    expect(await screen.findByText("Diesel Norte")).toBeVisible();
    expect(await screen.findByText("AA123BB")).toBeVisible();
    expect(await screen.findByText("ALT-90")).toBeVisible();
    expect(screen.getByText("Órdenes")).toBeVisible();
    expect(screen.getByText("Historial")).toBeVisible();
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toContain(
      "https://backend.example.test/vehicles?page=1&limit=5&customerId=c1",
    );
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toContain(
      "https://backend.example.test/components?page=1&limit=5&customerId=c1",
    );
    expect(screen.getByRole("link", { name: "AA123BB" })).toHaveAttribute("href", "/vehicles/v1");
    expect(screen.getByRole("link", { name: "ALT-90" })).toHaveAttribute("href", "/components/p1");
    expect(screen.getAllByRole("button", { name: "Editar" })).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: "Crear" })).toHaveLength(2);
  });

  it("shows related preview loading states after customer detail loads", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/vehicles") || url.includes("/components")) {
        return new Promise<Response>(() => undefined);
      }
      return Response.json({
        id: "c1",
        name: "Diesel Norte",
        documentNumber: "30-2",
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { container } = renderWithQuery(<CustomerDetailPage customerId="c1" />);

    expect(await screen.findByText("Diesel Norte")).toBeVisible();
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(6);
  });

  it("shows related preview empty states and scoped create actions", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/vehicles") || url.includes("/components")) {
        return Response.json({ data: [], meta: { page: 1, limit: 5, total: 0, totalPages: 1 } });
      }
      return Response.json({
        id: "c1",
        name: "Diesel Norte",
        documentNumber: "30-2",
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithQuery(<CustomerDetailPage customerId="c1" />);

    expect(await screen.findByText("Sin vehículos")).toBeVisible();
    expect(await screen.findByText("Sin componentes")).toBeVisible();
    const createButtons = screen.getAllByRole("button", { name: "Crear" });
    expect(createButtons).toHaveLength(2);

    await userEvent.click(createButtons[0]);

    expect(await screen.findByRole("dialog")).toHaveTextContent("Nuevo vehículo");
  });

  it("shows retryable related preview errors", async () => {
    let vehicleCalls = 0;
    let componentCalls = 0;
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/vehicles")) {
        vehicleCalls += 1;
        if (vehicleCalls === 1) return Response.json({ message: "Failed" }, { status: 500 });
        return Response.json({ data: [{ id: "v2", customerId: "c1", plate: "BB234CC", brand: "Scania", modelReference: "R" }], meta: { page: 1, limit: 5, total: 1, totalPages: 1 } });
      }
      if (url.includes("/components")) {
        componentCalls += 1;
        if (componentCalls === 1) return Response.json({ message: "Failed" }, { status: 500 });
        return Response.json({ data: [{ id: "p2", customerId: "c1", componentTypeId: "ct1", brand: "Bosch", reference: "ALT", identifier: "ALT-100", componentType: { id: "ct1", name: "Alternador" } }], meta: { page: 1, limit: 5, total: 1, totalPages: 1 } });
      }
      return Response.json({
        id: "c1",
        name: "Diesel Norte",
        documentNumber: "30-2",
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithQuery(<CustomerDetailPage customerId="c1" />);

    expect(await screen.findByText("No pudimos cargar vehículos")).toBeVisible();
    expect(await screen.findByText("No pudimos cargar componentes")).toBeVisible();

    const retryButtons = screen.getAllByRole("button", { name: "Reintentar" });
    await userEvent.click(retryButtons[0]);
    await userEvent.click(retryButtons[1]);

    expect(await screen.findByText("BB234CC")).toBeVisible();
    expect(await screen.findByText("ALT-100")).toBeVisible();
  });

  it("shows a safe back path when the customer is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "Not found" }, { status: 404 })),
    );

    renderWithQuery(<CustomerDetailPage customerId="missing" />);

    expect(await screen.findByText("No pudimos cargar el cliente")).toBeVisible();
    expect(screen.getByRole("link", { name: "Volver a clientes" })).toHaveAttribute(
      "href",
      "/customers",
    );
  });
});
