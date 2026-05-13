"use client";

import { FormEvent, useState } from "react";
import { CopyIcon, KeyRoundIcon } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useGenerateRecoveryPhraseMutation, useRecoveryStatusQuery } from "@/hooks/use-auth";
import type { GenerateRecoveryPhraseResponse } from "@/lib/auth/types";
import { generateRecoveryPhraseSchema } from "@/lib/validation/auth";

export function RecoveryOnboarding({ enabled }: { enabled: boolean }) {
  const status = useRecoveryStatusQuery(enabled);
  const generatePhrase = useGenerateRecoveryPhraseMutation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [phrase, setPhrase] = useState<GenerateRecoveryPhraseResponse | null>(null);

  if (!enabled) {
    return null;
  }

  if (status.isPending) {
    return <Skeleton className="h-44 w-full rounded-2xl" />;
  }

  if (status.data?.enabled && !phrase) {
    return null;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = generateRecoveryPhraseSchema.safeParse({ currentPassword });

    if (!parsed.success) {
      setFieldError(parsed.error.flatten().fieldErrors.currentPassword?.[0] ?? "Contraseña inválida.");
      return;
    }

    setFieldError("");
    const response = await generatePhrase.mutateAsync(parsed.data);
    setPhrase(response);
  }

  async function copyPhrase() {
    if (!phrase) return;
    await navigator.clipboard.writeText(phrase.phrase);
    toast.success("Frase copiada. Guardala fuera del sistema.");
  }

  if (phrase) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Guardá esta frase ahora</CardTitle>
          <CardDescription>
            Se muestra una sola vez. Copiala, imprimila o guardala fuera del
            sistema antes de cerrar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-xl border bg-muted/40 p-4 font-mono text-sm leading-7">
            {phrase.phrase}
          </div>
          <Button type="button" variant="outline" onClick={copyPhrase}>
            <CopyIcon data-icon="inline-start" aria-hidden="true" />
            Copiar frase
          </Button>
          <Field orientation="horizontal">
            <Checkbox
              id="phrase-ack"
              checked={acknowledged}
              onCheckedChange={(value) => setAcknowledged(value === true)}
            />
            <FieldLabel htmlFor="phrase-ack">
              Confirmo que la copié, imprimí o guardé offline.
            </FieldLabel>
          </Field>
        </CardContent>
        <CardFooter>
          <Button type="button" disabled={!acknowledged} onClick={() => setPhrase(null)}>
            Terminar
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Activá tu frase de recuperación</CardTitle>
        <CardDescription>
          Un paso corto para que puedas recuperar el acceso sin WhatsApp, email
          ni soporte externo.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <Alert>
          <KeyRoundIcon aria-hidden="true" />
          <AlertTitle>Guardala fuera del sistema</AlertTitle>
          <AlertDescription>
            La frase se muestra una sola vez y no se guarda en texto claro.
          </AlertDescription>
        </Alert>
        <form className="flex w-full flex-col gap-4" onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(fieldError)}>
              <FieldLabel htmlFor="recovery-current-password">
                Confirmá tu contraseña actual
              </FieldLabel>
              <Input
                id="recovery-current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                aria-invalid={Boolean(fieldError)}
                disabled={generatePhrase.isPending}
              />
              <FieldDescription>
                Después vas a copiar o imprimir las 8 palabras.
              </FieldDescription>
              <FieldError>{fieldError}</FieldError>
            </Field>
            <Button className="w-full sm:w-fit" type="submit" disabled={generatePhrase.isPending}>
              {generatePhrase.isPending ? <Spinner data-icon="inline-start" /> : null}
              Generar frase
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
