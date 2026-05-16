import { render } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const comboboxMock = vi.hoisted(() => ({
  rootProps: [] as Array<Record<string, unknown>>,
  contentProps: [] as Array<Record<string, unknown>>,
  inputProps: [] as Array<Record<string, unknown>>,
}));

vi.mock("@/components/ui/combobox", () => ({
  Combobox: ({ children, ...props }: { children: ReactNode }) => {
    comboboxMock.rootProps.push(props);
    return <div data-testid="combobox-root">{children}</div>;
  },
  ComboboxContent: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => {
    comboboxMock.contentProps.push(props);
    return <div>{children}</div>;
  },
  ComboboxEmpty: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  ComboboxInput: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => {
    comboboxMock.inputProps.push(props);
    return <div>{children}</div>;
  },
  ComboboxItem: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  ComboboxList: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

import { OptionCombobox } from "@/features/assets/option-combobox";

describe("OptionCombobox", () => {
  it("passes modal mode to the combobox root when requested", () => {
    renderOptionCombobox({ modal: true });

    expect(comboboxMock.rootProps.at(-1)).toMatchObject({ modal: true });
  });

  it("passes a portal container to render modal popups inside dialog content", () => {
    const portalContainer = { current: document.createElement("div") };

    renderOptionCombobox({ modal: true, portalContainer });

    expect(comboboxMock.contentProps.at(-1)).toMatchObject({
      container: portalContainer,
    });
  });

  it("leaves non-modal combobox usage unchanged by default", () => {
    renderOptionCombobox();

    expect(comboboxMock.rootProps.at(-1)?.modal).toBeUndefined();
  });

  it("derives the selected option from the current value during render", () => {
    renderOptionCombobox({ value: "vehicle-2" });

    expect(comboboxMock.rootProps.at(-1)?.value).toEqual({
      id: "vehicle-2",
      label: "Vehicle Two",
      description: null,
    });
  });

  it("renders a visible required marker when the field is required", () => {
    const { getByText } = renderOptionCombobox({ required: true });

    expect(getByText("*")).toBeVisible();
  });

  it("marks the input as required for assistive technology", () => {
    renderOptionCombobox({ required: true });

    expect(comboboxMock.inputProps.at(-1)).toMatchObject({
      "aria-required": true,
    });
  });

  it("preserves free text when Base UI clears input on popup close without a selection", () => {
    const onInputValueChange = vi.fn();

    renderOptionCombobox({
      freeText: true,
      inputValue: "Cliente nuevo",
      onInputValueChange,
    });

    const onRootInputValueChange = comboboxMock.rootProps.at(-1)
      ?.onInputValueChange as (value: string, details: { reason: string }) => void;
    onRootInputValueChange("", { reason: "focus-out" });

    expect(onInputValueChange).not.toHaveBeenCalled();
  });

  it("keeps intentional clear actions working in free-text mode", () => {
    const onInputValueChange = vi.fn();

    renderOptionCombobox({
      freeText: true,
      inputValue: "Cliente nuevo",
      onInputValueChange,
    });

    const onRootInputValueChange = comboboxMock.rootProps.at(-1)
      ?.onInputValueChange as (value: string, details: { reason: string }) => void;
    onRootInputValueChange("", { reason: "input-clear" });

    expect(onInputValueChange).toHaveBeenCalledWith("");
  });

  it("keeps non-free-text reset behavior unchanged", () => {
    const onInputValueChange = vi.fn();

    renderOptionCombobox({ inputValue: "Cliente nuevo", onInputValueChange });

    const onRootInputValueChange = comboboxMock.rootProps.at(-1)
      ?.onInputValueChange as (value: string, details: { reason: string }) => void;
    onRootInputValueChange("", { reason: "focus-out" });

    expect(onInputValueChange).toHaveBeenCalledWith("");
  });
});

function renderOptionCombobox(
  props: Partial<ComponentProps<typeof OptionCombobox>> = {},
) {
  comboboxMock.rootProps = [];
  comboboxMock.contentProps = [];
  comboboxMock.inputProps = [];

  return render(
    <OptionCombobox
      id="asset-option"
      label="Asset option"
      value={null}
      options={[
        { id: "vehicle-1", label: "Vehicle One", description: null },
        { id: "vehicle-2", label: "Vehicle Two", description: null },
      ]}
      inputValue=""
      placeholder="Search options"
      emptyText="No options found."
      onInputValueChange={vi.fn()}
      onValueChange={vi.fn()}
      {...props}
    />,
  );
}
