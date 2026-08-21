import type { AuthUser } from "../../auth/types/auth.types";

const summaryCards = [
  ["Estudiantes activos", "1,284", "Seguimiento consolidado"],
  ["Alertas por revisar", "36", "Incidencias y observaciones"],
  ["Cursos asignados", "72", "Gestión académica vigente"],
  ["Reportes IA", "18", "Recomendaciones generadas"],
];

type AdminDashboardPageProps = {
  user: AuthUser;
};

export function AdminDashboardPage({ user }: AdminDashboardPageProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs">
        <p className="text-sm font-semibold text-brand-600">
          Bienvenido, {user.full_name || user.username}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900">
          Resumen del seguimiento académico
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
          Administra la información institucional, consulta módulos por permiso
          y mantén el acompañamiento estudiantil desde un panel centralizado.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(([title, value, description]) => (
          <article
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs"
            key={title}
          >
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <strong className="mt-3 block text-3xl font-bold text-gray-900">
              {value}
            </strong>
            <p className="mt-2 text-sm text-gray-500">{description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs">
          <h3 className="text-lg font-bold text-gray-900">
            Actividad reciente
          </h3>
          <div className="mt-5 space-y-4">
            {[
              "Nuevas observaciones docentes registradas.",
              "Recomendaciones IA listas para evaluación directiva.",
              "Actualización de calificaciones pendiente de revisión.",
            ].map((item) => (
              <div className="flex gap-3" key={item}>
                <span className="mt-2 h-2 w-2 rounded-full bg-brand-500" />
                <p className="text-sm text-gray-600">{item}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-brand-100 bg-brand-50 p-6 shadow-theme-xs">
          <h3 className="text-lg font-bold text-gray-900">
            Validación de permisos
          </h3>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            El menú lateral se filtra antes de mostrarse usando el perfil
            autenticado retornado por la API. Los superusuarios y directivos
            pueden ver todas las opciones administrativas.
          </p>
        </article>
      </section>
    </div>
  );
}
