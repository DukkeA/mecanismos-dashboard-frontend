import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RecoverPage from "@/app/(auth)/recover/page";

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

describe("recover page", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://backend.example.test";
    replaceMock.mockClear();
  });

  it("shows generic validation and recovery failure states", async () => {
    const user = userEvent.setup();
    renderWithQuery(<RecoverPage />);

    await user.click(screen.getByRole("button", { name: "Recuperar" }));

    expect(await screen.findByText("Ingresá un email válido.")).toBeVisible();
    expect(screen.getByText("Completá las 8 palabras de recuperación.")).toBeVisible();

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await fillRecoveryWords(user, ["uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho"]);
    await user.type(screen.getByLabelText("Nueva contraseña"), "newpass123");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "Nope" }, { status: 400 })),
    );

    await user.click(screen.getByRole("button", { name: "Recuperar" }));

    expect(await screen.findByText("La recuperación falló.")).toBeVisible();
  });

  it("submits normalized recovery details and returns to login on success", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ success: true }));
    vi.stubGlobal("fetch", fetchMock);
    renderWithQuery(<RecoverPage />);

    await user.type(screen.getByLabelText("Email"), " USER@EXAMPLE.COM ");
    await fillRecoveryWords(user, ["Uno", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho"]);
    await user.type(screen.getByLabelText("Nueva contraseña"), "newpass123");
    await user.click(screen.getByRole("button", { name: "Recuperar" }));

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({
      email: "user@example.com",
      recoveryPhrase: "uno dos tres cuatro cinco seis siete ocho",
    });
  });
});

async function fillRecoveryWords(
  user: ReturnType<typeof userEvent.setup>,
  words: string[],
) {
  for (const [index, word] of words.entries()) {
    await user.type(screen.getByLabelText(`Palabra ${index + 1}`), word);
  }
}
