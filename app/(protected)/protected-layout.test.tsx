import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProtectedLayout from "@/app/(protected)/layout";
import { TooltipProvider } from "@/components/ui/tooltip";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(),
}));

function renderWithQuery(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{ui}</TooltipProvider>
    </QueryClientProvider>,
  );
}

describe("protected layout", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://backend.example.test";
    replaceMock.mockClear();
  });

  it("renders protected content only after /auth/me returns a verified user", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          id: "u1",
          email: "user@example.com",
          name: "User",
          role: "ADMIN",
          mustChangePassword: false,
        }),
      ),
    );

    renderWithQuery(<ProtectedLayout><p>Contenido protegido</p></ProtectedLayout>);

    expect(screen.getByText("Verificando sesión")).toBeInTheDocument();
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
    expect(await screen.findByText("user@example.com")).toBeVisible();
    expect(screen.getByText("Contenido protegido")).toBeVisible();
  });

  it("redirects unauthenticated users to login without rendering protected content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "Unauthorized" }, { status: 401 })),
    );

    renderWithQuery(<ProtectedLayout><p>Secret</p></ProtectedLayout>);

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith("/login?next=%2Fdashboard"),
    );
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("blocks normal app navigation while password change is required", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          id: "u1",
          email: "user@example.com",
          name: "User",
          role: "ADMIN",
          mustChangePassword: true,
        }),
      ),
    );

    renderWithQuery(<ProtectedLayout><p>Secret</p></ProtectedLayout>);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/change-password"));
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });
});
