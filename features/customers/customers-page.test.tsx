import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CustomersPage } from "@/features/customers/customers-page";
import { CustomerFormDialog } from "@/features/customers/customer-form-dialog";
import { CustomersTable } from "@/features/customers/customers-table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { legacyStringToRichTextNote } from "@/lib/rich-text";
import type { Customer } from "@/lib/customers/types";

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
              documentType: "NIT",
              isActive: true,
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
              documentType: "NIT",
              isActive: true,
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
    await userEvent.type(within(dialog).getByLabelText("Documento / NIT"), "31-9");
    await userEvent.type(within(dialog).getByLabelText("Teléfono"), "29155501");

    const form = document.getElementById("customer-form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() =>
      expect(within(screen.getByRole("dialog")).getByLabelText("Nombre o razón social"))
        .toBeDisabled(),
    );
    const postCall = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith("/customers") && init?.method === "POST");
    const postBody = JSON.parse(String(postCall?.[1]?.body));
    expect(postBody).toMatchObject({ documentType: "NIT", phone: "29155501", isActive: true });
    expect(postBody).not.toHaveProperty("status");
    expect(postBody).not.toHaveProperty("address");

    resolveCreate(Response.json({ id: "c9", name: "Nuevo Cliente", documentNumber: "31" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("submits customer notes as JSON and clears existing notes as null", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ id: "c1", name: "Cliente con Nota", documentNumber: "31", notes: legacyStringToRichTextNote("Important JSON note") }))
      .mockResolvedValueOnce(Response.json({ id: "c2", name: "Cliente Existente", documentNumber: "32", notes: null }));
    vi.stubGlobal("fetch", fetchMock);

    const jsonCustomer: Customer = customerRow("c1", "Cliente con Nota", legacyStringToRichTextNote("Important JSON note"));
    const existingCustomer: Customer = customerRow("c2", "Cliente Existente", legacyStringToRichTextNote("Existing note"));
    const { unmount } = renderWithProviders(<CustomerFormDialog customer={jsonCustomer} trigger={<button type="button">Editar cliente con nota</button>} />);

    await userEvent.click(screen.getByRole("button", { name: "Editar cliente con nota" }));
    let dialog = await screen.findByRole("dialog");

    fireEvent.submit(document.getElementById("customer-form") as HTMLFormElement);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("https://backend.example.test/customers/c1", expect.objectContaining({ method: "PATCH" })));
    const jsonPatchCall = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith("/customers/c1") && init?.method === "PATCH");
    const jsonPatchBody = JSON.parse(String(jsonPatchCall?.[1]?.body));
    expect(jsonPatchBody.notes).toEqual(expect.objectContaining({ root: expect.objectContaining({ type: "root" }) }));
    expect(typeof jsonPatchBody.notes).not.toBe("string");
    unmount();

    renderWithProviders(<CustomerFormDialog customer={existingCustomer} trigger={<button type="button">Editar cliente</button>} />);

    await userEvent.click(screen.getByRole("button", { name: "Editar cliente" }));
    dialog = await screen.findByRole("dialog");
    const notesEditor = within(dialog).getByRole("textbox", { name: "Notas" });
    notesEditor.focus();
    await userEvent.keyboard("{Control>}a{/Control}{Backspace}");

    fireEvent.submit(document.getElementById("customer-form") as HTMLFormElement);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("https://backend.example.test/customers/c2", expect.objectContaining({ method: "PATCH" })));
    const patchCall = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith("/customers/c2") && init?.method === "PATCH");
    expect(JSON.parse(String(patchCall?.[1]?.body))).toMatchObject({ notes: null });
  });

  it("renders customer mobile previews from JSON, legacy, long, and unknown notes", () => {
    const params = { page: 1, limit: 10, sortBy: "name" as const, sortDir: "asc" as const };
    const longText = "This customer note is intentionally long so the compact preview truncates it for cards and keeps the mobile layout readable.";
    const rows: Customer[] = [
      customerRow("c-json", "JSON Customer", legacyStringToRichTextNote("JSON preview note")),
      customerRow("c-legacy", "Legacy Customer", legacyStringToRichTextNote("Legacy preview note")),
      customerRow("c-long", "Long Customer", legacyStringToRichTextNote(longText)),
      customerRow("c-unknown", "Unknown Customer", { root: { type: "root", children: [{ type: "unknown", children: [{ type: "text", text: "Unknown note text" }] }] } } as Customer["notes"]),
    ];

    renderWithProviders(<CustomersTable params={params} page={{ data: rows, meta: { page: 1, limit: 10, total: rows.length, totalPages: 1 } }} isPending={false} isError={false} onRetry={vi.fn()} onParamsChange={vi.fn()} />);

    expect(screen.getByText("JSON preview note")).toBeVisible();
    expect(screen.getByText("Legacy preview note")).toBeVisible();
    expect(screen.getByText("Unknown note text")).toBeVisible();
    expect(screen.getByText((content) => content.startsWith("This customer note is intentionally long") && content.endsWith("…"))).toBeVisible();
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

function customerRow(id: string, name: string, notes: Customer["notes"]): Customer {
  return { id, name, documentType: "NIT", documentNumber: "30-1", email: null, phone: "29155501", notes, status: "active", createdAt: null, updatedAt: null };
}
