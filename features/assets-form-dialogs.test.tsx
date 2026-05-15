import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const optionComboboxMock = vi.hoisted(() => ({
  props: [] as Array<ComponentProps<typeof import("@/features/assets/option-combobox").OptionCombobox>>,
}));

vi.mock("@/features/assets/option-combobox", () => ({
  OptionCombobox: (
    props: ComponentProps<typeof import("@/features/assets/option-combobox").OptionCombobox>,
  ) => {
    optionComboboxMock.props.push(props);
    return <input aria-label={props.label} disabled={props.disabled} id={props.id} />;
  },
}));

import { ComponentFormDialog } from "@/features/components/component-form-dialog";
import { VehicleFormDialog } from "@/features/vehicles/vehicle-form-dialog";

describe("asset form dialog combobox configuration", () => {
  it("keeps the vehicle customer combobox modal and portal-contained", async () => {
    renderWithQuery(<VehicleFormDialog trigger={<button type="button">Nuevo vehículo</button>} />);

    await userEvent.click(screen.getByRole("button", { name: "Nuevo vehículo" }));

    const customerCombobox = optionComboboxMock.props.find((props) => props.id === "vehicle-customer");
    expect(customerCombobox).toMatchObject({ modal: true });
    expect(customerCombobox?.portalContainer).toEqual(expect.objectContaining({ current: expect.any(HTMLElement) }));
  });

  it("keeps the component customer combobox modal and portal-contained", async () => {
    renderWithQuery(<ComponentFormDialog trigger={<button type="button">Nuevo componente</button>} />);

    await userEvent.click(screen.getByRole("button", { name: "Nuevo componente" }));

    const customerCombobox = optionComboboxMock.props.find((props) => props.id === "component-customer");
    expect(customerCombobox).toMatchObject({ modal: true });
    expect(customerCombobox?.portalContainer).toEqual(expect.objectContaining({ current: expect.any(HTMLElement) }));
  });
});

function renderWithQuery(ui: ReactNode) {
  optionComboboxMock.props = [];
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}
