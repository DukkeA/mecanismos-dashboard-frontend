"use client";

import { FormEvent, useState } from "react";
import { CopyIcon, KeyRoundIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  useGenerateRecoveryPhraseMutation,
  useRecoveryStatusQuery,
} from "@/hooks/use-auth";
import type { GenerateRecoveryPhraseResponse } from "@/lib/auth/types";
import { generateRecoveryPhraseSchema } from "@/lib/validation/auth";

export function RecoveryPhraseDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const status = useRecoveryStatusQuery(open);
  const generatePhrase = useGenerateRecoveryPhraseMutation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [phrase, setPhrase] = useState<GenerateRecoveryPhraseResponse | null>(null);

  function resetDialog() {
    setCurrentPassword("");
    setFieldError("");
    setFormError("");
    setAcknowledged(false);
    setPhrase(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetDialog();
    }

    onOpenChange(nextOpen);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = generateRecoveryPhraseSchema.safeParse({ currentPassword });

    if (!parsed.success) {
      setFieldError(
        parsed.error.flatten().fieldErrors.currentPassword?.[0] ??
          "Contraseña inválida.",
      );
      return;
    }

    setFieldError("");
    setFormError("");

    try {
      const response = await generatePhrase.mutateAsync(parsed.data);
      setPhrase(response);
    } catch {
      setFormError("No pudimos generar la frase de recuperación.");
    }
  }

  async function copyPhrase() {
    if (!phrase) return;
    await navigator.clipboard.writeText(phrase.phrase);
    toast.success("Frase copiada. Guardala fuera del sistema.");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cambiar frase de recuperación</DialogTitle>
          <DialogDescription>
            Generá una frase nueva de 8 palabras y guardala fuera del sistema.
            Se muestra una sola vez.
          </DialogDescription>
        </DialogHeader>
        {phrase ? (
          <div className="flex flex-col gap-4">
            <Alert>
              <KeyRoundIcon aria-hidden="true" />
              <AlertTitle>Guardala ahora</AlertTitle>
              <AlertDescription>
                Copiala, imprimila o guardala offline antes de cerrar este modal.
              </AlertDescription>
            </Alert>
            <div className="rounded-xl border bg-muted/40 p-4 font-mono text-sm leading-7">
              {phrase.phrase}
            </div>
            <Button type="button" variant="outline" onClick={copyPhrase}>
              <CopyIcon data-icon="inline-start" aria-hidden="true" />
              Copiar frase
            </Button>
            <Field orientation="horizontal">
              <Checkbox
                id="dialog-phrase-ack"
                checked={acknowledged}
                onCheckedChange={(value) => setAcknowledged(value === true)}
              />
              <FieldLabel htmlFor="dialog-phrase-ack">
                Confirmo que la copié, imprimí o guardé offline.
              </FieldLabel>
            </Field>
            <DialogFooter>
              <Button
                type="button"
                disabled={!acknowledged}
                onClick={() => handleOpenChange(false)}
              >
                Terminar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <RecoveryPhraseForm
            currentPassword={currentPassword}
            fieldError={fieldError}
            formError={formError}
            hasExistingPhrase={Boolean(status.data?.enabled)}
            isGenerating={generatePhrase.isPending}
            isLoading={status.isPending}
            isStatusError={status.isError}
            onCancel={() => handleOpenChange(false)}
            onPasswordChange={setCurrentPassword}
            onRetryStatus={() => void status.refetch()}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RecoveryPhraseForm({
  currentPassword,
  fieldError,
  formError,
  hasExistingPhrase,
  isGenerating,
  isLoading,
  isStatusError,
  onCancel,
  onPasswordChange,
  onRetryStatus,
  onSubmit,
}: {
  currentPassword: string;
  fieldError: string;
  formError: string;
  hasExistingPhrase: boolean;
  isGenerating: boolean;
  isLoading: boolean;
  isStatusError: boolean;
  onCancel: () => void;
  onPasswordChange: (value: string) => void;
  onRetryStatus: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      {isStatusError ? (
        <Alert>
          <RotateCcwIcon aria-hidden="true" />
          <AlertTitle>No pudimos leer el estado actual</AlertTitle>
          <AlertDescription>
            Podés reintentar o generar una nueva frase si confirmás tu contraseña.
          </AlertDescription>
          <Button className="w-fit" type="button" variant="outline" onClick={onRetryStatus}>
            Reintentar
          </Button>
        </Alert>
      ) : null}
      {hasExistingPhrase ? (
        <Alert>
          <KeyRoundIcon aria-hidden="true" />
          <AlertTitle>Ya hay una frase activa</AlertTitle>
          <AlertDescription>
            Si generás otra, guardá la nueva inmediatamente y descartá la anterior.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <KeyRoundIcon aria-hidden="true" />
          <AlertTitle>Guardala fuera del sistema</AlertTitle>
          <AlertDescription>
            La frase no se guarda en texto claro y no podremos mostrarla de nuevo.
          </AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Field data-invalid={Boolean(fieldError)}>
          <FieldLabel htmlFor="dialog-recovery-current-password">
            Confirmá tu contraseña actual
          </FieldLabel>
          <Input
            id="dialog-recovery-current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => onPasswordChange(event.target.value)}
            aria-invalid={Boolean(fieldError)}
            disabled={isGenerating}
          />
          <FieldDescription>
            Después vas a copiar o imprimir las 8 palabras.
          </FieldDescription>
          <FieldError>{fieldError}</FieldError>
        </Field>
        <Field data-invalid={Boolean(formError)}>
          <FieldError>{formError}</FieldError>
        </Field>
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isGenerating}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isGenerating}>
          {isGenerating ? <Spinner data-icon="inline-start" /> : null}
          Generar frase
        </Button>
      </DialogFooter>
    </form>
  );
}
