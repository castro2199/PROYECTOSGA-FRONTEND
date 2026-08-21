import { Button } from "../../../shared/components/Button";

const metrics = [
  { value: "360", label: "vista del estudiante" },
  { value: "IA", label: "alertas tempranas" },
  { value: "Cloud", label: "acceso seguro" },
];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-50 to-white" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-brand-100 bg-white px-4 py-2 text-sm font-semibold text-brand-600 shadow-theme-xs">
            Plataforma académica Cloud con Inteligencia Artificial
          </p>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-title-xl">
            Seguimiento estudiantil inteligente para instituciones conectadas
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Centraliza asistencia, tareas, calificaciones, observaciones y
            reportes para detectar riesgos académicos a tiempo y acompañar
            mejor a cada estudiante.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="#modulos">Ver módulos</Button>
            <Button href="#tecnologia" variant="outline">
              Conocer la tecnología
            </Button>
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {metrics.map((metric) => (
              <div
                className="rounded-lg border border-gray-100 bg-white p-4 shadow-theme-xs"
                key={metric.label}
              >
                <strong className="block text-xl font-bold text-gray-900">
                  {metric.value}
                </strong>
                <span className="mt-1 block text-xs font-medium text-gray-500">
                  {metric.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-8 top-10 h-40 w-40 rounded-full bg-brand-100 blur-3xl" />
          <div className="absolute -right-8 bottom-10 h-48 w-48 rounded-full bg-blue-light-100 blur-3xl" />
          <div className="relative rounded-2xl border border-gray-100 bg-white p-4 shadow-theme-xl">
            <div className="rounded-xl bg-gray-50 p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    Panel de seguimiento
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-gray-900">
                    Riesgo académico por curso
                  </h2>
                </div>
                <span className="rounded-full bg-success-50 px-3 py-1 text-xs font-semibold text-success-700">
                  En línea
                </span>
              </div>

              <div className="space-y-4">
                {[
                  ["Asistencia", "92%", "bg-success-500"],
                  ["Tareas entregadas", "78%", "bg-brand-500"],
                  ["Observaciones resueltas", "64%", "bg-warning-500"],
                ].map(([label, value, color]) => (
                  <div className="rounded-lg bg-white p-4 shadow-theme-xs" key={label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-700">{label}</span>
                      <span className="font-bold text-gray-900">{value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full ${color}`}
                        style={{ width: value }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-lg border border-brand-100 bg-brand-50 p-4">
                <p className="text-sm font-semibold text-brand-700">
                  Recomendación IA
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Priorizar tutoría para estudiantes con baja asistencia y
                  tareas pendientes durante la semana.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
