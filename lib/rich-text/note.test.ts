import { describe, expect, it } from "vitest";

import { EMPTY_RICH_TEXT_NOTE, extractPlainTextFromRichText, isRichTextNote, legacyStringToRichTextNote, normalizeRichTextNote, richTextNoteSchema } from "@/lib/rich-text";

describe("rich text notes", () => {
  it("normalizes omitted, empty, and valid notes", () => {
    expect(normalizeRichTextNote(undefined)).toBeNull();
    expect(normalizeRichTextNote(EMPTY_RICH_TEXT_NOTE)).toBeNull();

    const note = legacyStringToRichTextNote("Hello");
    expect(isRichTextNote(note)).toBe(true);
    expect(normalizeRichTextNote(note)).toEqual(note);
  });

  it("converts legacy strings for display without keeping runtime strings", () => {
    const note = normalizeRichTextNote(" Legacy note ");

    expect(typeof note).not.toBe("string");
    expect(extractPlainTextFromRichText(note)).toBe("Legacy note");
    expect(extractPlainTextFromRichText("Legacy note", 7)).toBe("Legacy…");
  });

  it("guards unsupported values without crashing", () => {
    expect(normalizeRichTextNote({ root: { type: "doc", children: [] } })).toBeNull();
    expect(extractPlainTextFromRichText({ bad: true })).toBe("");
    expect(richTextNoteSchema.parse({ root: { type: "root", children: [] } })).toBeNull();
  });
});
