"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  AuthRequestError,
  type AuthSuccess,
  type AuthUser,
  type GenerateRecoveryPhraseResponse,
  type RecoveryStatus,
} from "@/lib/auth/types";
import { authFetch } from "@/lib/auth/backend";
import type {
  ChangePasswordInput,
  GenerateRecoveryPhraseInput,
  LoginInput,
  RecoverWithPhraseInput,
} from "@/lib/validation/auth";

export const authQueryKeys = {
  all: ["auth"] as const,
  me: ["auth", "me"] as const,
  recoveryStatus: ["auth", "recovery-phrase", "status"] as const,
};

export { AuthRequestError as AuthClientError } from "@/lib/auth/types";

export function useMeQuery() {
  return useQuery({
    queryKey: authQueryKeys.me,
    queryFn: () => authFetch<AuthUser>("/auth/me", { refreshOnUnauthorized: true }),
    retryOnMount: false,
  });
}

export function useRecoveryStatusQuery(enabled: boolean) {
  return useQuery({
    queryKey: authQueryKeys.recoveryStatus,
    queryFn: () =>
      authFetch<RecoveryStatus>("/auth/recovery-phrase/status", {
        refreshOnUnauthorized: true,
      }),
    enabled,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) =>
      authFetch<AuthUser>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (user) => {
      queryClient.setQueryData(authQueryKeys.me, user);
      toast.success("Sesión iniciada.");
    },
    onError: () => {
      toast.error("No pudimos iniciar sesión. Revisá los datos e intentá otra vez.");
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      authFetch<AuthSuccess>("/auth/logout", {
        method: "POST",
      }),
    onSettled: () => {
      queryClient.removeQueries({ queryKey: authQueryKeys.all });
      toast.success("Sesión cerrada.");
    },
  });
}

export function useChangePasswordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      authFetch<AuthUser>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authQueryKeys.all });
      toast.success("Contraseña actualizada. Iniciá sesión nuevamente.");
    },
    onError: () => {
      toast.error("No pudimos cambiar la contraseña.");
    },
  });
}

export function useGenerateRecoveryPhraseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateRecoveryPhraseInput) =>
      authFetch<GenerateRecoveryPhraseResponse>(
        "/auth/recovery-phrase/generate",
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.recoveryStatus });
      toast.success("Frase de recuperación generada.");
    },
    onError: () => {
      toast.error("No pudimos generar la frase de recuperación.");
    },
  });
}

export function useRecoverWithPhraseMutation() {
  return useMutation({
    mutationFn: (input: RecoverWithPhraseInput) =>
      authFetch<AuthSuccess>("/auth/recovery-phrase/recover", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      toast.success("Contraseña recuperada. Iniciá sesión con la nueva clave.");
    },
    onError: (error) => {
      const message =
          error instanceof AuthRequestError && error.statusCode === 429
          ? "Demasiados intentos. Esperá y probá nuevamente."
          : "La recuperación falló.";
      toast.error(message);
    },
  });
}
