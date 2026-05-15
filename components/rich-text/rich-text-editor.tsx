"use client";

import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { useEffect, useMemo, useRef } from "react";

import { createLexKitNoteExtensions, LexKitNoteProvider, useLexKitNoteEditor } from "@/components/rich-text/lexkit-note-system";
import { RichTextToolbar } from "@/components/rich-text/rich-text-toolbar";
import { EMPTY_RICH_TEXT_NOTE, normalizeRichTextNote, type RichTextNote } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

export function RichTextEditor({ id, value, onChange, disabled, invalid, describedBy, labelledBy, placeholder = "Escribí una nota..." }: { id: string; value: RichTextNote | string | undefined; onChange: (value: RichTextNote) => void; disabled?: boolean; invalid?: boolean; describedBy?: string; labelledBy?: string; placeholder?: string }) {
  const extensions = useMemo(
    () =>
      createLexKitNoteExtensions({
        contentEditable: <ContentEditable id={id} aria-labelledby={labelledBy} aria-invalid={invalid} aria-describedby={describedBy} className="min-h-32 w-full px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" />,
        placeholder: <div className="pointer-events-none absolute top-2 left-3 text-sm text-muted-foreground">{placeholder}</div>,
      }),
    [describedBy, id, invalid, labelledBy, placeholder],
  );

  return (
    <div className={cn("overflow-hidden rounded-md border bg-background shadow-xs transition-colors", invalid && "border-destructive", disabled && "opacity-60")}>
      <LexKitNoteProvider extensions={extensions} config={{ theme: { text: { bold: "font-semibold", italic: "italic", underline: "underline" }, list: { ul: "ml-5 list-disc", ol: "ml-5 list-decimal", listitem: "pl-1" } } }}>
        <RichTextToolbar disabled={disabled} />
        <LexKitNoteBridge disabled={disabled} value={value} onChange={onChange} />
      </LexKitNoteProvider>
    </div>
  );
}

function LexKitNoteBridge({ value, onChange, disabled }: { value: RichTextNote | string | undefined; onChange: (value: RichTextNote) => void; disabled?: boolean }) {
  const { editor, import: editorImport } = useLexKitNoteEditor();
  const importedValueRef = useRef<string>("");
  const initialValue = useMemo(() => normalizeRichTextNote(value) ?? EMPTY_RICH_TEXT_NOTE, [value]);

  useEffect(() => {
    if (!editor) return;
    const nextValue = JSON.stringify(initialValue);
    if (importedValueRef.current === nextValue) return;
    editorImport.fromJSON(initialValue);
    importedValueRef.current = nextValue;
  }, [editor, initialValue, editorImport]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) return;

    return editor.registerUpdateListener(({ editorState }) => {
      const nextValue = normalizeRichTextNote(editorState.toJSON());
      importedValueRef.current = JSON.stringify(nextValue ?? EMPTY_RICH_TEXT_NOTE);
      onChange(nextValue);
    });
  }, [editor, onChange]);

  return null;
}
