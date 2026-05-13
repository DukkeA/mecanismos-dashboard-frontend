export type AuthRole = "ADMIN" | "SALES" | "MECHANIC";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  mustChangePassword: boolean;
};

export type RecoveryStatus = {
  enabled: boolean;
  generatedAt: string | null;
  consumedAt: string | null;
};

export type GenerateRecoveryPhraseResponse = {
  phrase: string;
  words: string[];
  generatedAt: string;
};

export type AuthSuccess = { success: true };

export type AuthErrorPayload = {
  message: string;
  statusCode: number;
};

export class AuthRequestError extends Error {
  statusCode: number;
  payload: AuthErrorPayload;

  constructor(payload: AuthErrorPayload) {
    super(payload.message);
    this.name = "AuthRequestError";
    this.statusCode = payload.statusCode;
    this.payload = payload;
  }
}
