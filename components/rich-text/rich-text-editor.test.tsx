import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RichTextField } from "@/components/rich-text/rich-text-field";
import { legacyStringToRichTextNote } from "@/lib/rich-text";

describe("RichTextField", () => {
  it("renders legacy content and exposes keyboard-operable toolbar controls", async () => {
    const onChange = vi.fn();

    render(<RichTextField id="notes" label="Notas" value={legacyStringToRichTextNote("Editable note")} onChange={onChange} />);

    expect(screen.getByRole("textbox", { name: "Notas" })).toHaveTextContent("Editable note");

    const bold = screen.getByRole("button", { name: "Negrita" });
    bold.focus();
    await userEvent.keyboard("{Enter}");

    expect(bold).toHaveFocus();
  });
});
