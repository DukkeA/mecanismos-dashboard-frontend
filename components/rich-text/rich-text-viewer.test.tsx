import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RichTextViewer } from "@/components/rich-text/rich-text-viewer";
import { legacyStringToRichTextNote } from "@/lib/rich-text";

describe("RichTextViewer", () => {
  it("renders JSON notes without exposing raw JSON", () => {
    render(<RichTextViewer value={legacyStringToRichTextNote("Readable note")} />);

    expect(screen.getByText("Readable note")).toBeVisible();
    expect(screen.queryByText(/root/)).not.toBeInTheDocument();
  });

  it("renders empty and legacy notes safely", () => {
    const { rerender } = render(<RichTextViewer value={null} />);

    expect(screen.getByText("Sin notas")).toBeVisible();

    rerender(<RichTextViewer value="Legacy runtime note" />);
    expect(screen.getByText("Legacy runtime note")).toBeVisible();
  });
});
