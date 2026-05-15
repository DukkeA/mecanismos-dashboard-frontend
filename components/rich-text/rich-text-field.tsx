"use client";

import { RichTextEditor } from "@/components/rich-text/rich-text-editor";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import type { RichTextNote } from "@/lib/rich-text";

export function RichTextField({ id, label, value, onChange, description, error, disabled }: { id: string; label: string; value: RichTextNote | string | undefined; onChange: (value: RichTextNote) => void; description?: string; error?: string; disabled?: boolean }) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const labelId = `${id}-label`;

  return (
    <Field data-invalid={Boolean(error)} data-disabled={disabled}>
      <FieldLabel id={labelId}>{label}</FieldLabel>
      {description ? <FieldDescription id={descriptionId}>{description}</FieldDescription> : null}
      <RichTextEditor id={id} value={value} disabled={disabled} invalid={Boolean(error)} labelledBy={labelId} describedBy={[descriptionId, errorId].filter(Boolean).join(" ") || undefined} onChange={onChange} />
      <FieldError id={errorId} errors={[{ message: error }]} />
    </Field>
  );
}
