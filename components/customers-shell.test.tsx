import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppSidebar } from "@/components/app-sidebar";
import { SearchForm } from "@/components/search-form";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { AuthUser } from "@/lib/auth/types";

const pushMock = vi.fn();
let pathnameMock = "/customers/c1";

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock,
  useRouter: () => ({ push: pushMock }),
}));

function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>{ui}</SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

const user: AuthUser = {
  id: "u1",
  email: "user@example.com",
  name: "User",
  role: "ADMIN",
  mustChangePassword: false,
};

describe("customers shell integration", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://backend.example.test";
    pushMock.mockClear();
    pathnameMock = "/customers/c1";
  });

  it("enables sidebar customers navigation and renders customers breadcrumbs", () => {
    renderWithProviders(
      <>
        <AppSidebar user={user} />
        <SiteHeader />
      </>,
    );

    expect(screen.getAllByRole("link", { name: /Clientes/ })[0]).toHaveAttribute(
      "href",
      "/customers",
    );
    expect(screen.getAllByText("Próximo")).toHaveLength(3);
    expect(screen.getByText("Detalle")).toBeVisible();
  });

  it("searches customers globally and navigates selected results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Response.json([{ id: "c7", name: "Cliente Ruta", documentNumber: "30-7" }]),
      ),
    );

    renderWithProviders(<SearchForm />);

    await userEvent.type(screen.getByLabelText("Buscar"), "ruta");
    expect((await screen.findAllByText("Cliente Ruta"))[0]).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Abrir Cliente Ruta" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/customers/c7"));
  });

  it("offers the customers list when global search has no results", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([])));

    renderWithProviders(<SearchForm />);

    await userEvent.type(screen.getByLabelText("Buscar"), "sin resultados");

    expect(await screen.findByText("No encontramos clientes.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Ir a clientes" })).toHaveAttribute(
      "href",
      "/customers",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });
});
