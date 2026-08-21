const benefits = [
  {
    title: "Seguimiento temprano",
    description:
      "Identifica señales de riesgo antes de que impacten el rendimiento del estudiante.",
  },
  {
    title: "Datos centralizados",
    description:
      "Une asistencia, tareas, calificaciones y observaciones en una sola vista académica.",
  },
  {
    title: "Decisiones accionables",
    description:
      "Convierte indicadores en reportes claros para docentes, coordinadores y directivos.",
  },
];

export function LandingBenefits() {
  return (
    <section className="bg-gray-50 px-6 py-20 lg:px-8" id="beneficios">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-500">
            Beneficios
          </p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900">
            Una gestión académica más visible, rápida y preventiva
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {benefits.map((benefit) => (
            <article
              className="rounded-lg border border-gray-100 bg-white p-6 shadow-theme-sm"
              key={benefit.title}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-lg font-bold text-brand-600">
                {benefit.title.charAt(0)}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{benefit.title}</h3>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                {benefit.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
