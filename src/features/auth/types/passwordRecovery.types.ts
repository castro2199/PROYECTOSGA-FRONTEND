export type PasswordResetValidation = {
  detail: string;
  valid: boolean;
};

export type PasswordResetConfirmPayload = {
  confirmar_password: string;
  nueva_password: string;
  token: string;
  uid: string;
};

export class PasswordResetError extends Error {
  fieldErrors: Record<string, string[]>;
  status: number;

  constructor(message: string, status: number, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.fieldErrors = fieldErrors;
    this.status = status;
  }
}
