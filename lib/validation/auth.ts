import { z } from "zod";

const passwordMessage = "Debe tener al menos 8 caracteres.";
export const RECOVERY_WORD_COUNT = 8;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ingresá un email válido."),
  password: z.string().min(1, "Ingresá tu contraseña."),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().trim().min(8, passwordMessage),
    newPassword: z.string().trim().min(8, passwordMessage),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    path: ["newPassword"],
    message: "Usá una contraseña nueva distinta.",
  });

export const generateRecoveryPhraseSchema = z.object({
  currentPassword: z.string().trim().min(8, passwordMessage),
});

const recoveryPhraseStringSchema = z
  .string()
  .transform(normalizeRecoveryPhrase)
  .refine((value) => /^[a-z]+(?: [a-z]+){7}$/.test(value), {
    message: "Ingresá exactamente 8 palabras en minúscula.",
  });

const recoveryWordsSchema = z
  .array(z.string().transform(normalizeRecoveryWord))
  .length(RECOVERY_WORD_COUNT, `Ingresá exactamente ${RECOVERY_WORD_COUNT} palabras.`)
  .refine((words) => words.every(Boolean), {
    message: "Completá las 8 palabras de recuperación.",
  })
  .refine((words) => words.every((word) => /^[a-z]+$/.test(word)), {
    message: "Usá solo letras en minúscula, sin espacios ni símbolos.",
  })
  .transform((words) => words.join(" "));

export const recoverWithPhraseSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ingresá un email válido."),
  recoveryWords: recoveryWordsSchema,
  newPassword: z.string().trim().min(8, passwordMessage),
}).transform(({ recoveryWords, ...value }) => ({
  ...value,
  recoveryPhrase: recoveryWords,
}));

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type GenerateRecoveryPhraseInput = z.infer<
  typeof generateRecoveryPhraseSchema
>;
export type RecoverWithPhraseFormInput = z.input<typeof recoverWithPhraseSchema>;
export type RecoverWithPhraseInput = z.output<typeof recoverWithPhraseSchema>;

export function normalizeRecoveryPhrase(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeRecoveryWord(value: string) {
  return value.trim().toLowerCase();
}

export function recoveryWordsFromPhrase(value: string) {
  return normalizeRecoveryPhrase(value).split(" ");
}

export { recoveryPhraseStringSchema };
