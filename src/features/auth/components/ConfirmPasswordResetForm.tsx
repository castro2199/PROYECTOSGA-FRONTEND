import { type FormEvent, useEffect, useState } from "react";
import {
  confirmPasswordReset,
  validatePasswordReset,
} from "../services/passwordRecoveryService";
import { PasswordResetError } from "../types/passwordRecovery.types";

type RecoveryLink = { token: string; uid: string };
type ScreenState = "checking" | "invalid" | "ready" | "updating" | "updated" | "error";

function getRecoveryLink(): RecoveryLink | null {
  const params = new URLSearchParams(window.location.search);
  const uid = params.get("uid");
  const token = params.get("token");
  return uid && token ? { token, uid } : null;
}

function passwordErrors(password: string, confirmPassword: string) {
  const errors: Record<string, string> = {};
  if (!password) errors.nueva_password = "Ingresa una nueva contrasena.";
  else if (password.length < 12) errors.nueva_password = "La contrasena debe tener al menos 12 caracteres.";
  if (!confirmPassword) errors.confirmar_password = "Confirma la nueva contrasena.";
  else if (password !== confirmPassword) errors.confirmar_password = "Las contrasenas no coinciden.";
  return errors;
}

export function ConfirmPasswordResetForm() {
  const [link, setLink] = useState<RecoveryLink | null>(getRecoveryLink);
  const [state, setState] = useState<ScreenState>(link ? "checking" : "invalid");
  const [message, setMessage] = useState(link ? "Validando el enlace de recuperacion..." : "El enlace de recuperacion es invalido o ha expirado.");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!link) return;
    window.history.replaceState({}, "", window.location.pathname);
    const controller = new AbortController();
    validatePasswordReset(link.uid, link.token, controller.signal)
      .then((result) => {
        if (result.valid) {
          setState("ready");
          setMessage(result.detail);
        } else {
          setState("invalid");
          setMessage(result.detail);
        }
      })
      .catch((validationError) => {
        if ((validationError as { name?: string }).name === "AbortError") return;
        setState("error");
        setMessage(validationError instanceof Error ? validationError.message : "No se pudo validar el enlace.");
      });
    return () => controller.abort();
  }, [link]);

  useEffect(() => {
    if (state !== "updated") return;
    const timeout = window.setTimeout(() => {
      window.history.replaceState({}, "", "/login");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }, 2200);
    return () => window.clearTimeout(timeout);
  }, [state]);

  const updateField = (field: "password" | "confirm", value: string) => {
    if (field === "password") setPassword(value);
    else setConfirmPassword(value);
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.confirmar_password;
      delete next.nueva_password;
      delete next.non_field_errors;
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state !== "ready" || !link) return;
    const errors = passwordErrors(password, confirmPassword);
    if (Object.keys(errors).length) {
      setFieldErrors(Object.fromEntries(Object.entries(errors).map(([key, value]) => [key, [value]])));
      return;
    }

    setState("updating");
    setFieldErrors({});
    try {
      const detail = await confirmPasswordReset({
        confirmar_password: confirmPassword,
        nueva_password: password,
        token: link.token,
        uid: link.uid,
      });
      setLink(null);
      setPassword("");
      setConfirmPassword("");
      setMessage(detail);
      setState("updated");
    } catch (updateError) {
      if (updateError instanceof PasswordResetError) {
        setFieldErrors({
          ...updateError.fieldErrors,
          non_field_errors: updateError.fieldErrors.non_field_errors ?? [updateError.message],
        });
        setMessage(updateError.message);
      } else {
        setMessage("No se pudo conectar con el servidor. Intenta nuevamente.");
      }
      setState("ready");
    }
  };

  const isReady = state === "ready" || state === "updating";
  const isUpdating = state === "updating";
  const formError = fieldErrors.non_field_errors?.[0];

  return <section className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12 lg:px-8"><div className="w-full max-w-[590px] rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-theme-xs sm:px-14 sm:py-14"><div className="mb-10"><h2 className="text-3xl font-bold tracking-tight text-gray-900">Nueva contrasena</h2><p className="mt-2 text-sm text-gray-500">{message}</p></div>{state === "checking" && <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">Validando enlace...</div>}{(state === "invalid" || state === "error") && <><div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div><a className="mt-6 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-600" href="/recuperar-contrasena">Solicitar un nuevo enlace</a></>}{state === "updated" && <div className="rounded-lg border border-success-100 bg-success-50 px-4 py-3 text-sm text-success-700">{message} Redirigiendo al inicio de sesion...</div>}{isReady && <form className="space-y-6" noValidate onSubmit={(event) => void handleSubmit(event)}><div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"><p className="font-semibold text-gray-900">Requisitos de la contrasena</p><ul className="mt-2 space-y-1 text-gray-600"><li className={password.length >= 12 ? "text-success-700" : ""}>Al menos 12 caracteres.</li><li className={Boolean(confirmPassword) && password === confirmPassword ? "text-success-700" : ""}>Las dos contrasenas deben coincidir.</li></ul></div><div><label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="new-password">Nueva contrasena</label><div className="flex gap-2"><input autoComplete="new-password" className={`h-11 min-w-0 flex-1 rounded-lg border bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${fieldErrors.nueva_password ? "border-red-400" : "border-gray-200"}`} disabled={isUpdating} id="new-password" onChange={(event) => updateField("password", event.target.value)} type={showPassword ? "text" : "password"} value={password} /><button className="h-11 shrink-0 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50" disabled={isUpdating} onClick={() => setShowPassword((current) => !current)} type="button">{showPassword ? "Ocultar" : "Mostrar"}</button></div>{fieldErrors.nueva_password?.map((error) => <p className="mt-2 text-sm text-red-600" key={error}>{error}</p>)}</div><div><label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="confirm-password">Confirmar nueva contrasena</label><div className="flex gap-2"><input autoComplete="new-password" className={`h-11 min-w-0 flex-1 rounded-lg border bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${fieldErrors.confirmar_password ? "border-red-400" : "border-gray-200"}`} disabled={isUpdating} id="confirm-password" onChange={(event) => updateField("confirm", event.target.value)} type={showConfirmPassword ? "text" : "password"} value={confirmPassword} /><button className="h-11 shrink-0 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50" disabled={isUpdating} onClick={() => setShowConfirmPassword((current) => !current)} type="button">{showConfirmPassword ? "Ocultar" : "Mostrar"}</button></div>{fieldErrors.confirmar_password?.map((error) => <p className="mt-2 text-sm text-red-600" key={error}>{error}</p>)}</div>{formError && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}<button className="flex h-11 w-full items-center justify-center rounded-lg bg-[#152b68] px-5 text-sm font-semibold text-white shadow-theme-sm hover:bg-[#102352] disabled:cursor-not-allowed disabled:opacity-70" disabled={isUpdating} type="submit">{isUpdating ? "Actualizando..." : "Actualizar contrasena"}</button></form>}</div></section>;
}
