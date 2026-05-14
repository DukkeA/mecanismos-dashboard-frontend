"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useLoginMutation } from "@/hooks/use-auth";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";

type LoginErrors = Partial<Record<keyof LoginInput | "form", string>>;

export default function LoginPage() {
  const router = useRouter();
  const login = useLoginMutation();
  const [values, setValues] = useState<LoginInput>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = loginSchema.safeParse(values);

    if (!parsed.success) {
      setErrors(zodErrors(parsed.error.flatten().fieldErrors));
      return;
    }

    setErrors({});

    try {
      const user = await login.mutateAsync(parsed.data);
      const fallback = user.mustChangePassword ? "/change-password" : "/dashboard";
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(safeNext(next, fallback));
    } catch {
      setErrors({ form: "Credenciales inválidas o sesión no disponible." });
    }
  }

  return (
    <AuthCardShell
      title="Iniciar sesión"
      description="Ingresá tu email y contraseña para acceder."
      headline="Bienvenido a la app de gestión de Mecanismos Técnicos."
      supportingText="Ingresá tus credenciales para acceder al tablero de trabajo."
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
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              aria-invalid={Boolean(errors.email)}
              disabled={login.isPending}
            />
            <FieldError>{errors.email}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.password)}>
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              aria-invalid={Boolean(errors.password)}
              disabled={login.isPending}
            />
            <FieldError>{errors.password}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.form)}>
            <Button type="submit" size="lg" disabled={login.isPending}>
              {login.isPending ? <Spinner data-icon="inline-start" /> : null}
              Entrar
            </Button>
            <FieldError>{errors.form}</FieldError>
          </Field>
        </FieldGroup>

        <p className="text-center text-sm text-muted-foreground">
          ¿No podés entrar?{" "}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/recover">
            Recuperar con frase
          </Link>
        </p>
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

function safeNext(value: string | null, fallback: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
