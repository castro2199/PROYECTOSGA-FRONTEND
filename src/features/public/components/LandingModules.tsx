const modules = [
  "Asistencia estudiantil",
  "Tareas académicas",
  "Calificaciones",
  "Observaciones docentes",
  "Reportes",
  "Recomendaciones con IA",
];

export function LandingModules() {
  return (
    <section className="bg-white px-6 py-20 lg:px-8" id="modulos">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-500">
            Módulos principales
          </p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900">
            Todo el ciclo de seguimiento académico en un solo sistema
          </h2>
          <p className="mt-4 text-base leading-7 text-gray-600">
            Diseñado para que cada área académica trabaje con información
            consistente, trazable y lista para tomar decisiones.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, index) => (
            <article
              className="group rounded-lg border border-gray-100 bg-white p-6 shadow-theme-xs transition hover:-translate-y-1 hover:border-brand-100 hover:shadow-theme-md"
              key={module}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-sm font-bold text-brand-500 group-hover:bg-brand-50">
                0{index + 1}
              </span>
              <h3 className="mt-5 text-lg font-bold text-gray-900">{module}</h3>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Gestiona, consulta y analiza información clave para fortalecer
                el acompañamiento estudiantil.
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
