import { type FormEvent, useState } from "react";
import { requestPasswordReset } from "../services/passwordRecoveryService";
import { PasswordResetError } from "../types/passwordRecovery.types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RecoverPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Ingresa tu correo institucional.");
      setMessage("");
      return;
    }

    if (!emailPattern.test(trimmedEmail)) {
      setError("Ingresa un correo valido.");
      setMessage("");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      setMessage(await requestPasswordReset(trimmedEmail));
    } catch (requestError) {
      setError(
        requestError instanceof PasswordResetError
          ? requestError.message
          : "No se pudo conectar con el servidor. Intenta nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12 lg:px-8">
      <div className="w-full max-w-[590px] rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-theme-xs sm:px-14 sm:py-14">
        <div className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Recuperar contrasena
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Valida tu correo institucional para continuar.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-gray-700"
              htmlFor="email"
            >
              Correo
            </label>
            <input
              autoComplete="email"
              className={`h-11 w-full rounded-lg border bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                error ? "border-red-400" : "border-gray-200"
              }`}
              id="email"
              name="email"
              disabled={isSubmitting}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
                setMessage("");
              }}
              placeholder="usuario@institucion.edu.pe"
              type="email"
              value={email}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          {message && (
            <div className="rounded-lg border border-success-100 bg-success-50 px-4 py-3 text-sm text-success-700">
              {message}
            </div>
          )}

          <button
            className="flex h-11 w-full items-center justify-center rounded-lg bg-[#152b68] px-5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-[#102352] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Enviando..." : "Enviar enlace de recuperacion"}
          </button>

          <a
            className="inline-flex text-sm font-semibold text-brand-700 hover:text-brand-600"
            href="/login"
          >
            Volver al inicio de sesion
          </a>
        </form>
      </div>
    </section>
  );
}
