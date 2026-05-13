"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useChangePasswordMutation } from "@/hooks/use-auth";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validation/auth";

type ChangePasswordErrors = Partial<Record<keyof ChangePasswordInput | "form", string>>;

const initialValues: ChangePasswordInput = {
  currentPassword: "",
  newPassword: "",
};

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const changePassword = useChangePasswordMutation();
  const [values, setValues] = useState<ChangePasswordInput>(initialValues);
  const [errors, setErrors] = useState<ChangePasswordErrors>({});

  function resetForm() {
    setValues(initialValues);
    setErrors({});
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
  }

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
      handleOpenChange(false);
      router.replace("/login");
    } catch {
      setErrors({ form: "No pudimos actualizar la contraseña." });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            Actualizá tu clave y volvé a iniciar sesión para renovar la sesión.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.currentPassword)}>
              <FieldLabel htmlFor="dialog-current-password">
                Contraseña actual
              </FieldLabel>
              <Input
                id="dialog-current-password"
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
              <FieldLabel htmlFor="dialog-new-password">
                Nueva contraseña
              </FieldLabel>
              <Input
                id="dialog-new-password"
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
              <FieldError>{errors.form}</FieldError>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={changePassword.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? <Spinner data-icon="inline-start" /> : null}
              Guardar contraseña
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
