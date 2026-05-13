"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useChangePasswordMutation } from "@/hooks/use-auth";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validation/auth";

type ChangePasswordErrors = Partial<Record<keyof ChangePasswordInput | "form", string>>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const changePassword = useChangePasswordMutation();
  const [values, setValues] = useState<ChangePasswordInput>({
    currentPassword: "",
    newPassword: "",
  });
  const [errors, setErrors] = useState<ChangePasswordErrors>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = changePasswordSchema.safeParse(values);

    if (!parsed.success) {
      setErrors(zodErrors(parsed.error.flatten().fieldErrors));
      return;
    }

    setErrors({});

    try {
      await changePassword.mutateAsync(parsed.data);
      router.replace("/login");
    } catch {
      setErrors({ form: "No pudimos actualizar la contraseña." });
    }
  }

  return (
    <AuthCardShell
      title="Cambiar contraseña"
      description="Tu contraseña temporal debe cambiarse antes de abrir el tablero. Después vas a iniciar sesión de nuevo."
    >
      <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <Field data-invalid={Boolean(errors.currentPassword)}>
            <FieldLabel htmlFor="currentPassword">Contraseña actual</FieldLabel>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={values.currentPassword}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  currentPassword: event.target.value,
                }))
              }
              aria-invalid={Boolean(errors.currentPassword)}
              disabled={changePassword.isPending}
            />
            <FieldError>{errors.currentPassword}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.newPassword)}>
            <FieldLabel htmlFor="newPassword">Nueva contraseña</FieldLabel>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={values.newPassword}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  newPassword: event.target.value,
                }))
              }
              aria-invalid={Boolean(errors.newPassword)}
              disabled={changePassword.isPending}
            />
            <FieldDescription>Mínimo 8 caracteres.</FieldDescription>
            <FieldError>{errors.newPassword}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.form)}>
            <Button type="submit" size="lg" disabled={changePassword.isPending}>
              {changePassword.isPending ? <Spinner data-icon="inline-start" /> : null}
              Guardar contraseña
            </Button>
            <FieldError>{errors.form}</FieldError>
          </Field>
        </FieldGroup>
      </form>
    </AuthCardShell>
  );
}

function zodErrors<T extends string>(errors: Partial<Record<T, string[]>>) {
  return Object.fromEntries(
    Object.entries(errors).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : undefined,
    ]),
  ) as Partial<Record<T, string>>;
}
