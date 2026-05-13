import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RecoveryOnboarding } from "@/components/auth/recovery-onboarding";

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

describe("recovery onboarding", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://backend.example.test";
  });

  it("does not show onboarding when the dashboard disables the check", () => {
    renderWithQuery(<RecoveryOnboarding enabled={false} />);

    expect(screen.queryByText("Activá tu frase de recuperación")).not.toBeInTheDocument();
  });

  it("loads recovery status, generates a one-time phrase, and requires offline acknowledgement", async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: writeTextMock },
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ enabled: false, generatedAt: null, consumedAt: null }),
      )
      .mockResolvedValueOnce(
        Response.json({
          phrase: "uno dos tres cuatro cinco seis siete ocho",
          words: ["uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho"],
          generatedAt: "2026-05-12T00:00:00.000Z",
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    renderWithQuery(<RecoveryOnboarding enabled />);

    expect(await screen.findByText("Activá tu frase de recuperación")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Generar frase" }));
    expect(await screen.findByText("Debe tener al menos 8 caracteres.")).toBeVisible();

    await user.type(screen.getByLabelText("Confirmá tu contraseña actual"), "current123");
    await user.click(screen.getByRole("button", { name: "Generar frase" }));

    expect(await screen.findByText("Guardá esta frase ahora")).toBeVisible();
    expect(screen.getByText("uno dos tres cuatro cinco seis siete ocho")).toBeVisible();
    expect(screen.getByRole("button", { name: "Terminar" })).toBeDisabled();

    await user.click(screen.getByLabelText("Confirmo que la copié, imprimí o guardé offline."));
    expect(screen.getByRole("button", { name: "Terminar" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Copiar frase" }));

    await waitFor(() =>
      expect(writeTextMock).toHaveBeenCalledWith("uno dos tres cuatro cinco seis siete ocho"),
    );
    expect(toast.success).toHaveBeenCalledWith(
      "Frase copiada. Guardala fuera del sistema.",
    );
  });
});
