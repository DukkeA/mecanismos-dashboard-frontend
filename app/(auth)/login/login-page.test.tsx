import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/(auth)/login/page";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

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

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("login page", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://backend.example.test";
    replaceMock.mockClear();
    window.history.replaceState({}, "", "/login");
  });

  it("renders accessible responsive login UI", () => {
    const { container } = renderWithQuery(<LoginPage />);

    expect(screen.getByText("Iniciar sesión")).toBeVisible();
    expect(
      screen.getByText("Bienvenido a la app de gestión de Mecanismos Técnicos."),
    ).toBeVisible();
    expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(container.querySelector("main")).toHaveClass("md:grid", "md:grid-cols-2");
  });

  it("blocks invalid input with visible errors and aria-invalid state", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderWithQuery(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Ingresá un email válido.")).toBeVisible();
    expect(screen.getByText("Ingresá tu contraseña.")).toBeVisible();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("disables controls while login is pending and opens the requested next route", async () => {
    window.history.replaceState({}, "", "/login?next=%2Fdashboard%3Ftab%3Dorders");
    const user = userEvent.setup();
    let resolveLogin: (response: Response) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveLogin = resolve;
          }),
      ),
    );
    renderWithQuery(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "secret");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByLabelText("Contraseña")).toBeDisabled();
    expect(screen.getByRole("button", { name: /Entrar/ })).toBeDisabled();

    resolveLogin(
      Response.json({
        id: "u1",
        email: "user@example.com",
        name: "User",
        role: "ADMIN",
        mustChangePassword: false,
      }),
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/dashboard?tab=orders"));
    expect(toast.success).toHaveBeenCalledWith("Sesión iniciada.");
  });

  it("redirects temporary-password users into forced password change", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          id: "u1",
          email: "user@example.com",
          name: "User",
          role: "MECHANIC",
          mustChangePassword: true,
        }),
      ),
    );
    renderWithQuery(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "secret");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/change-password"));
  });

  it("shows generic form and toast errors for login failures", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ message: "Invalid credentials" }, { status: 401 }),
      ),
    );
    renderWithQuery(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "wrong");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Credenciales inválidas o sesión no disponible.")).toBeVisible();
    expect(toast.error).toHaveBeenCalledWith(
      "No pudimos iniciar sesión. Revisá los datos e intentá otra vez.",
    );
  });
});
