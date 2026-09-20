import { useState } from "react";
import { useAuth } from "./useAuth";
import { clearMfaChallenge, getStoredMfaChallenge } from "../services/authService";
import {
  isMfaChallenge,
  type LoginCredentials,
  type MfaChallenge,
} from "../types/auth.types";

type LoginErrors = Partial<Record<keyof LoginCredentials | "code" | "form", string>>;

const initialCredentials: LoginCredentials = {
  username: "",
  password: "",
};

function validate(credentials: LoginCredentials) {
  const errors: LoginErrors = {};

  if (!credentials.username.trim()) {
    errors.username = "Ingresa tu usuario institucional.";
  }

  if (!credentials.password) {
    errors.password = "Ingresa tu contraseña.";
  }

  return errors;
}

export function useLogin() {
  const { login, verifyMfa } = useAuth();
  const [credentials, setCredentials] =
    useState<LoginCredentials>(initialCredentials);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge | null>(() =>
    getStoredMfaChallenge(),
  );
  const [code, setCode] = useState("");

  const updateField = (field: keyof LoginCredentials, value: string) => {
    setCredentials((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
  };

  const submit = async () => {
    const validationErrors = validate(credentials);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await login({
        username: credentials.username.trim(),
        password: credentials.password,
      });
      if (isMfaChallenge(result)) {
        setMfaChallenge(result);
        setCode("");
      }
    } catch (error) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado al iniciar sesión.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateCode = (value: string) => {
    setCode(value.replace(/\s/g, ""));
    setErrors((current) => ({ ...current, code: undefined, form: undefined }));
  };

  const verifyCode = async () => {
    if (!mfaChallenge) return;
    if (!code.trim()) {
      setErrors({ code: "Ingresa el codigo recibido por correo." });
      return;
    }

    setIsLoading(true);
    setErrors({});
    try {
      await verifyMfa(mfaChallenge, code.trim());
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : "No se pudo verificar el codigo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const useAnotherAccount = () => {
    clearMfaChallenge();
    setMfaChallenge(null);
    setCode("");
    setErrors({});
  };

  return {
    credentials,
    code,
    errors,
    isLoading,
    isMfaPending: Boolean(mfaChallenge),
    mfaChallenge,
    submit,
    updateCode,
    updateField,
    useAnotherAccount,
    verifyCode,
  };
}
