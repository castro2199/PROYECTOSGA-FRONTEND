import { Button } from "../../../shared/components/Button";

export function LandingTechnology() {
  return (
    <section className="bg-gray-950 px-6 py-20 text-white lg:px-8" id="tecnologia">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-300">
            Cloud e Inteligencia Artificial
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            Infraestructura moderna para instituciones que necesitan actuar a tiempo
          </h2>
          <p className="mt-5 text-base leading-7 text-gray-300">
            La plataforma combina disponibilidad Cloud, paneles de seguimiento y
            recomendaciones con IA para anticipar casos críticos, reducir carga
            operativa y mejorar el acompañamiento académico.
          </p>
          <div className="mt-8">
            <Button href="#beneficios" variant="soft">
              Explorar beneficios
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Cloud seguro", "Acceso centralizado, escalable y disponible para equipos académicos."],
            ["Analítica predictiva", "Lectura de patrones para detectar estudiantes que requieren atención."],
            ["Automatización", "Reportes y alertas que reducen tareas repetitivas del equipo docente."],
            ["Acompañamiento", "Recomendaciones orientadas a acciones concretas de seguimiento."],
          ].map(([title, description]) => (
            <article
              className="rounded-lg border border-white/10 bg-white/[0.04] p-6 shadow-theme-lg"
              key={title}
            >
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-gray-300">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
