import { describe, expect, it } from "vitest";

import {
  changePasswordSchema,
  loginSchema,
  normalizeRecoveryPhrase,
  recoveryWordsFromPhrase,
  recoverWithPhraseSchema,
} from "@/lib/validation/auth";

describe("auth validation schemas", () => {
  it("normalizes login email and blocks empty passwords", () => {
    expect(
      loginSchema.parse({ email: "  USER@EXAMPLE.COM ", password: "secret" }),
    ).toEqual({ email: "user@example.com", password: "secret" });

    const result = loginSchema.safeParse({ email: "bad", password: "" });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.email?.[0]).toBe(
      "Ingresá un email válido.",
    );
    expect(result.error?.flatten().fieldErrors.password?.[0]).toBe(
      "Ingresá tu contraseña.",
    );
  });

  it("requires password flow constraints and a different new password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "password1",
      newPassword: "password1",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.newPassword?.[0]).toBe(
      "Usá una contraseña nueva distinta.",
    );
  });

  it("normalizes and validates exactly eight lowercase recovery words", () => {
    expect(normalizeRecoveryPhrase("  Uno   Dos tres Cuatro cinco seis siete ocho  ")).toBe(
      "uno dos tres cuatro cinco seis siete ocho",
    );

    expect(
      recoverWithPhraseSchema.parse({
        email: " USER@EXAMPLE.COM ",
        recoveryWords: ["Uno", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho"],
        newPassword: "newpass123",
      }),
    ).toEqual({
      email: "user@example.com",
      recoveryPhrase: "uno dos tres cuatro cinco seis siete ocho",
      newPassword: "newpass123",
    });

    const result = recoverWithPhraseSchema.safeParse({
      email: "user@example.com",
      recoveryWords: recoveryWordsFromPhrase("uno dos tres"),
      newPassword: "newpass123",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["recoveryWords"]);
    expect(result.error?.issues[0]?.message).toBe("Ingresá exactamente 8 palabras.");
  });
});
