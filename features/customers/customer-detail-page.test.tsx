import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
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

  it("renders customer detail and related placeholders", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          id: "c1",
          name: "Diesel Norte",
          documentNumber: "30-2",
          email: "admin@diesel.test",
          phone: "29155502",
          address: "Ruta 3",
        }),
      ),
    );

    renderWithQuery(<CustomerDetailPage customerId="c1" />);

    expect(await screen.findByText("Diesel Norte")).toBeVisible();
    expect(screen.getByText("Vehículos")).toBeVisible();
    expect(screen.getByText("Componentes")).toBeVisible();
    expect(screen.getByText("Órdenes")).toBeVisible();
    expect(screen.getByText("Historial")).toBeVisible();
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
