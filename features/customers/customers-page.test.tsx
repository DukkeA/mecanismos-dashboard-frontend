import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CustomersPage } from "@/features/customers/customers-page";
import { TooltipProvider } from "@/components/ui/tooltip";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{ui}</TooltipProvider>
    </QueryClientProvider>,
  );
}

describe("CustomersPage", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://backend.example.test";
  });

  it("renders loading, customers, and server sort requests", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          data: [
            {
              id: "c1",
              name: "Transporte Austral",
              documentNumber: "30-1",
              email: "ops@austral.test",
              phone: "29155501",
              status: "active",
            },
          ],
          meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          data: [],
          meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<CustomersPage />);

    expect(screen.getAllByText(/Clientes/).length).toBeGreaterThan(0);
    expect(screen.getByRole("status", { name: "Cargando clientes" })).toBeVisible();
    expect(screen.getByText("Buscá, ordená y mantené los datos base de los clientes del taller.")).toBeVisible();
    expect((await screen.findAllByText("Transporte Austral"))[0]).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Ordenar por Cliente" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenLastCalledWith(
      "https://backend.example.test/customers?page=1&limit=10&sortBy=name&sortDir=desc",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("requests server search, pagination, and exposes row actions", async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Response.json({
        data: [
          {
            id: "c1",
            name: "Transporte Austral",
            documentNumber: "30-1",
            email: "ops@austral.test",
            phone: "29155501",
            status: "active",
          },
        ],
        meta: { page: 1, limit: 10, total: 11, totalPages: 2 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<CustomersPage />);

    expect((await screen.findAllByText("Transporte Austral"))[0]).toBeVisible();

    await userEvent.type(screen.getByLabelText("Buscar clientes"), "austral");

    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        "https://backend.example.test/customers?page=1&limit=10&search=austral&sortBy=name&sortDir=asc",
        expect.objectContaining({ credentials: "include" }),
      ),
    );

    await userEvent.click(screen.getByRole("link", { name: "Go to next page" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        "https://backend.example.test/customers?page=2&limit=10&search=austral&sortBy=name&sortDir=asc",
        expect.objectContaining({ credentials: "include" }),
      ),
    );

    await userEvent.click(screen.getByRole("button", { name: "Acciones de Transporte Austral" }));

    expect(screen.getByRole("menuitem", { name: "Ver detalle" })).toHaveAttribute(
      "href",
      "/customers/c1",
    );
  });

  it("shows empty state and keeps invalid create dialog open", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<CustomersPage />);

    expect(await screen.findByText("No hay clientes para mostrar")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Crear cliente" }));
    await userEvent.click(screen.getByRole("button", { name: "Crear cliente" }));

    expect(await screen.findByText("Ingresá el nombre del cliente.")).toBeVisible();
  });

  it("disables form controls while creating and closes after success", async () => {
    let resolveCreate: (response: Response) => void = () => undefined;
    const createResponse = new Promise<Response>((resolve) => {
      resolveCreate = resolve;
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          data: [],
          meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
        }),
      )
      .mockReturnValueOnce(createResponse)
      .mockResolvedValue(
        Response.json({
          data: [{ id: "c9", name: "Nuevo Cliente", documentNumber: "31" }],
          meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<CustomersPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Crear cliente" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Nombre o razón social"), "Nuevo Cliente");
    await userEvent.type(within(dialog).getByLabelText("Documento / CUIT"), "31-9");

    const form = document.getElementById("customer-form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() =>
      expect(within(screen.getByRole("dialog")).getByLabelText("Nombre o razón social"))
        .toBeDisabled(),
    );

    resolveCreate(Response.json({ id: "c9", name: "Nuevo Cliente", documentNumber: "31" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("shows a retryable error state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "Failed" }, { status: 500 })),
    );

    renderWithProviders(<CustomersPage />);

    expect(await screen.findByText("No pudimos cargar los clientes")).toBeVisible();
  });
});
