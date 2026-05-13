"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AuthClientError, useRecoverWithPhraseMutation } from "@/hooks/use-auth";
import {
  RECOVERY_WORD_COUNT,
  recoverWithPhraseSchema,
  type RecoverWithPhraseFormInput,
} from "@/lib/validation/auth";

type RecoverErrors = Partial<
  Record<keyof RecoverWithPhraseFormInput | "form", string>
>;

export default function RecoverPage() {
  const router = useRouter();
  const recover = useRecoverWithPhraseMutation();
  const [values, setValues] = useState<RecoverWithPhraseFormInput>({
    email: "",
    recoveryWords: Array.from({ length: RECOVERY_WORD_COUNT }, () => ""),
    newPassword: "",
  });
  const [errors, setErrors] = useState<RecoverErrors>({});

  function updateRecoveryWord(index: number, value: string) {
    setValues((current) => ({
      ...current,
      recoveryWords: updateWordAt(current.recoveryWords, index, value),
    }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = recoverWithPhraseSchema.safeParse(values);

    if (!parsed.success) {
      setErrors(zodErrors(parsed.error.flatten().fieldErrors));
      return;
    }

    setErrors({});

    try {
      await recover.mutateAsync(parsed.data);
      router.replace("/login");
    } catch (error) {
      setErrors({
        form:
          error instanceof AuthClientError && error.statusCode === 429
            ? "Demasiados intentos. Esperá y probá nuevamente."
            : "La recuperación falló.",
      });
    }
  }

  return (
    <AuthCardShell
      title="Recuperar acceso"
      description="Ingresá tu email, la frase exacta de 8 palabras y una contraseña nueva. Los errores se muestran de forma genérica por seguridad."
    >
      <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              autoComplete="email"
              inputMode="email"
              value={values.email}
              onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
              aria-invalid={Boolean(errors.email)}
              disabled={recover.isPending}
            />
            <FieldError>{errors.email}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.recoveryWords)}>
            <FieldLabel>Frase de recuperación</FieldLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {values.recoveryWords.map((word, index) => {
                const label = `Palabra ${index + 1}`;

                return (
                  <div key={label} className="flex flex-col gap-2">
                    <FieldLabel className="text-xs" htmlFor={`recovery-word-${index}`}>
                      {label}
                    </FieldLabel>
                    <Input
                      id={`recovery-word-${index}`}
                      autoComplete="off"
                      value={word}
                      onChange={(event) => updateRecoveryWord(index, event.target.value)}
                      aria-label={label}
                      aria-invalid={Boolean(errors.recoveryWords)}
                      disabled={recover.isPending}
                    />
                  </div>
                );
              })}
            </div>
            <FieldDescription>
              Ingresá cada palabra en su casillero, en el mismo orden.
            </FieldDescription>
            <FieldError>{errors.recoveryWords}</FieldError>
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
              disabled={recover.isPending}
            />
            <FieldError>{errors.newPassword}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.form)}>
            <Button type="submit" size="lg" disabled={recover.isPending}>
              {recover.isPending ? <Spinner data-icon="inline-start" /> : null}
              Recuperar
            </Button>
            <FieldError>{errors.form}</FieldError>
          </Field>
        </FieldGroup>

        <Link className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline" href="/login">
          Volver al inicio de sesión
        </Link>
      </form>
    </AuthCardShell>
  );
}

function updateWordAt(words: string[], index: number, value: string) {
  return words.map((word, currentIndex) =>
    currentIndex === index ? value : word,
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
