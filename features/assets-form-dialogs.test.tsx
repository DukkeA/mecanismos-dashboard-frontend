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
    return (
      <input
        aria-label={props.label}
        disabled={props.disabled}
        id={props.id}
        value={props.inputValue}
        onBlur={() => {
          if (!props.freeText) props.onInputValueChange("");
        }}
        onChange={(event) => props.onInputValueChange(event.currentTarget.value)}
      />
    );
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
    expect(customerCombobox?.freeText).toBe(true);
  });

  it("keeps the component customer combobox modal and portal-contained", async () => {
    renderWithQuery(<ComponentFormDialog trigger={<button type="button">Nuevo componente</button>} />);

    await userEvent.click(screen.getByRole("button", { name: "Nuevo componente" }));

    const customerCombobox = optionComboboxMock.props.find((props) => props.id === "component-customer");
    expect(customerCombobox).toMatchObject({ modal: true });
    expect(customerCombobox?.portalContainer).toEqual(expect.objectContaining({ current: expect.any(HTMLElement) }));
    expect(customerCombobox?.freeText).toBe(true);
  });

  it("keeps vehicle inline customer fields mounted when an inline field receives focus", async () => {
    const user = userEvent.setup();
    renderWithQuery(<VehicleFormDialog trigger={<button type="button">Nuevo vehículo</button>} />);

    await user.click(screen.getByRole("button", { name: "Nuevo vehículo" }));
    await user.type(screen.getByLabelText("Cliente"), "Cliente inexistente");

    expect(screen.getByLabelText("Nombre o razón social")).toBeVisible();

    await user.click(screen.getByLabelText("Teléfono"));
    await user.type(screen.getByLabelText("Teléfono"), "3001234567");

    expect(screen.getByLabelText("Nombre o razón social")).toBeVisible();
    expect(screen.getByLabelText("Cliente")).toHaveValue("Cliente inexistente");
  });

  it("keeps component inline customer fields mounted when an inline field receives focus", async () => {
    const user = userEvent.setup();
    renderWithQuery(<ComponentFormDialog trigger={<button type="button">Nuevo componente</button>} />);

    await user.click(screen.getByRole("button", { name: "Nuevo componente" }));
    await user.type(screen.getByLabelText("Cliente"), "Cliente inexistente");

    expect(screen.getByLabelText("Nombre o razón social")).toBeVisible();

    await user.click(screen.getByLabelText("Teléfono"));
    await user.type(screen.getByLabelText("Teléfono"), "3001234567");

    expect(screen.getByLabelText("Nombre o razón social")).toBeVisible();
    expect(screen.getByLabelText("Cliente")).toHaveValue("Cliente inexistente");
  });

  it("configures vehicle and component brand fields as free-text option comboboxes", async () => {
    const vehicleRender = renderWithQuery(<VehicleFormDialog trigger={<button type="button">Nuevo vehículo</button>} />);
    await userEvent.click(screen.getByRole("button", { name: "Nuevo vehículo" }));
    const vehicleBrand = optionComboboxMock.props.find((props) => props.id === "vehicle-brand");
    expect(vehicleBrand).toMatchObject({ freeText: true, modal: true });
    vehicleRender.unmount();

    renderWithQuery(<ComponentFormDialog trigger={<button type="button">Nuevo componente</button>} />);
    await userEvent.click(screen.getByRole("button", { name: "Nuevo componente" }));

    const componentBrand = optionComboboxMock.props.find((props) => props.id === "component-brand");

    expect(componentBrand).toMatchObject({ freeText: true, modal: true });
  });
});

function renderWithQuery(ui: ReactNode) {
  optionComboboxMock.props = [];
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}
