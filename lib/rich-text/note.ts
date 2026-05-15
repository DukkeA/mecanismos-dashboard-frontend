import { z } from "zod";

import type { LexicalEditorStateJson, LexicalSerializedNode, RichTextNote } from "@/lib/rich-text/types";

export const EMPTY_RICH_TEXT_NOTE: LexicalEditorStateJson = {
  root: {
    children: [
      {
        children: [],
        direction: null,
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
};

export function isRichTextNote(value: unknown): value is LexicalEditorStateJson {
  if (!isRecord(value) || !isRecord(value.root)) return false;
  return value.root.type === "root" && Array.isArray(value.root.children);
}

export function isEmptyRichTextNote(value: unknown): boolean {
  return extractPlainTextFromRichText(value).trim().length === 0;
}

export function legacyStringToRichTextNote(value: string): RichTextNote {
  const text = value.trim();
  if (!text) return null;

  return {
    root: {
      ...EMPTY_RICH_TEXT_NOTE.root,
      children: [
        {
          children: [{ detail: 0, format: 0, mode: "normal", style: "", text, type: "text", version: 1 }],
          direction: null,
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
    },
  };
}

export function normalizeRichTextNote(value: unknown): RichTextNote {
  if (value == null) return null;
  if (typeof value === "string") return legacyStringToRichTextNote(value);
  if (!isRichTextNote(value)) return null;
  return isEmptyRichTextNote(value) ? null : value;
}

export function extractPlainTextFromRichText(value: unknown, maxLength?: number): string {
  const note = typeof value === "string" ? legacyStringToRichTextNote(value) : isRichTextNote(value) ? value : null;
  if (!note) return "";

  const text = collectNodeText(note.root.children).replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!maxLength || text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export const richTextNoteSchema = z.preprocess(
  normalizeRichTextNote,
  z.custom<RichTextNote>((value) => value === null || isRichTextNote(value), "Ingresá una nota válida."),
);

function collectNodeText(nodes: LexicalSerializedNode[] | undefined): string {
  if (!nodes?.length) return "";

  return nodes
    .map((node) => {
      if (typeof node.text === "string") return node.text;
      const childText = collectNodeText(node.children);
      if (!childText) return "";
      if (node.type === "listitem") return `• ${childText}`;
      if (node.type === "paragraph" || node.type === "list") return `${childText}\n`;
      return childText;
    })
    .filter(Boolean)
    .join(" ")
    .replace(/ +\n/g, "\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
