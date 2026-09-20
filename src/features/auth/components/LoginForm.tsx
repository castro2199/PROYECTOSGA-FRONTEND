import type { FormEvent } from "react";
import { useLogin } from "../hooks/useLogin";

export function LoginForm() {
  const {
    code,
    credentials,
    errors,
    isLoading,
    isMfaPending,
    mfaChallenge,
    submit,
    updateCode,
    updateField,
    useAnotherAccount,
    verifyCode,
  } = useLogin();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  if (isMfaPending) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12 lg:px-8">
        <div className="w-full max-w-[590px] rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-theme-xs sm:px-14 sm:py-14">
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Verifica tu identidad</h2>
            <p className="mt-2 text-sm text-gray-500">{mfaChallenge?.message}</p>
          </div>
          <form className="space-y-6" noValidate onSubmit={(event) => { event.preventDefault(); void verifyCode(); }}>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="mfa-code">Codigo de verificacion</label>
              <input autoComplete="one-time-code" className={`h-11 w-full rounded-lg border bg-white px-4 text-center text-lg font-semibold tracking-[0.3em] text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${errors.code ? "border-red-400" : "border-gray-200"}`} id="mfa-code" inputMode="numeric" maxLength={8} name="code" onChange={(event) => updateCode(event.target.value)} placeholder="000000" value={code} />
              {errors.code && <p className="mt-2 text-sm text-red-600">{errors.code}</p>}
            </div>
            {errors.form && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{errors.form}</div>}
            <button className="flex h-11 w-full items-center justify-center rounded-lg bg-[#152b68] px-5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-[#102352] disabled:cursor-not-allowed disabled:opacity-70" disabled={isLoading} type="submit">{isLoading ? "Validando..." : "Verificar codigo"}</button>
            <button className="inline-flex text-sm font-semibold text-brand-700 hover:text-brand-600 disabled:opacity-50" disabled={isLoading} onClick={useAnotherAccount} type="button">Usar otra cuenta</button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12 lg:px-8">
      <div className="w-full max-w-[590px] rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-theme-xs sm:px-14 sm:py-14">
        <div className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Bienvenido al SGA
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Ingresa con tu cuenta institucional.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-gray-700"
              htmlFor="username"
            >
              Usuario
            </label>
            <input
              autoComplete="username"
              className={`h-11 w-full rounded-lg border bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                errors.username ? "border-red-400" : "border-gray-200"
              }`}
              id="username"
              name="username"
              onChange={(event) => updateField("username", event.target.value)}
              placeholder="usuario@institucion.edu.pe"
              type="text"
              value={credentials.username}
            />
            {errors.username && (
              <p className="mt-2 text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-gray-700"
              htmlFor="password"
            >
              Contraseña
            </label>
            <input
              autoComplete="current-password"
              className={`h-11 w-full rounded-lg border bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                errors.password ? "border-red-400" : "border-gray-200"
              }`}
              id="password"
              name="password"
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="••••••••••••"
              type="password"
              value={credentials.password}
            />
            {errors.password && (
              <p className="mt-2 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {errors.form && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errors.form}
            </div>
          )}

          <button
            className="flex h-11 w-full items-center justify-center rounded-lg bg-[#152b68] px-5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-[#102352] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>

          <a
            className="inline-flex text-sm font-semibold text-brand-700 hover:text-brand-600"
            href="/recuperar-contrasena"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </form>
      </div>
    </section>
  );
}
