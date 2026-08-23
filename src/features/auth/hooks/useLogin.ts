import { useState } from "react";
import { useAuth } from "./useAuth";
import type { LoginCredentials } from "../types/auth.types";

type LoginErrors = Partial<Record<keyof LoginCredentials | "form", string>>;

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
  const { login } = useAuth();
  const [credentials, setCredentials] =
    useState<LoginCredentials>(initialCredentials);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);

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
      await login({
        username: credentials.username.trim(),
        password: credentials.password,
      });
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

  return {
    credentials,
    errors,
    isLoading,
    submit,
    updateField,
  };
}
