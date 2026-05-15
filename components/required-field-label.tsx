import { FieldLabel } from "@/components/ui/field";

export function RequiredMarker() {
  return (
    <span aria-hidden="true" className="text-destructive">
      *
    </span>
  );
}

export function RequiredFieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <FieldLabel htmlFor={htmlFor}>{children}</FieldLabel>
      <RequiredMarker />
    </span>
  );
}
