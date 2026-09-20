import type { AdminMenuItem } from "../types/admin.types";

function menuIcon(label: string) {
  const iconByLabel: Record<string, string> = {
    AU: "/admin-icons/docs.svg",
    CF: "/admin-icons/plug-in.svg",
    DB: "/admin-icons/grid.svg",
    GA: "/admin-icons/calendar.svg",
    MT: "/admin-icons/table.svg",
    RP: "/admin-icons/docs.svg",
    SG: "/admin-icons/check-circle.svg",
    US: "/admin-icons/user-circle.svg",
  };

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50">
      <img alt="" className="h-5 w-5" src={iconByLabel[label]} />
    </span>
  );
}

export const adminMenu: AdminMenuItem[] = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: menuIcon("DB"),
    permission: "dashboard.view",
  },
  {
    label: "Gestión académica",
    path: "/admin/gestion-academica",
    icon: menuIcon("GA"),
    permission: "academic.view",
    children: [
      {
        label: "Años académicos",
        path: "/admin/gestion-academica/anios",
        icon: null,
        permission: "academic.years.view",
      },
      {
        label: "Periodos",
        path: "/admin/gestion-academica/periodos",
        icon: null,
        permission: "academic.periods.view",
      },
      {
        label: "Grados y secciones",
        path: "/admin/gestion-academica/grados-secciones",
        icon: null,
        permission: "academic.sections.view",
      },
      {
        label: "Cursos",
        path: "/admin/gestion-academica/cursos",
        icon: null,
        permission: "academic.courses.view",
      },
      {
        label: "Asignación de cursos",
        path: "/admin/gestion-academica/asignaciones",
        icon: null,
        permission: "academic.assignments.view",
      },
    ],
  },
  {
    label: "Usuarios",
    path: "/admin/usuarios",
    icon: menuIcon("US"),
    permission: "users.view",
    children: [
      {
        label: "Estudiantes",
        path: "/admin/usuarios/estudiantes",
        icon: null,
        permission: "users.students.view",
      },
      {
        label: "Docentes",
        path: "/admin/usuarios/docentes",
        icon: null,
        permission: "users.teachers.view",
      },
      {
        label: "Apoderados",
        path: "/admin/usuarios/apoderados",
        icon: null,
        permission: "users.guardians.view",
      },
      {
        label: "Usuarios y roles",
        path: "/admin/usuarios/roles",
        icon: null,
        permission: "users.roles.view",
      },
    ],
  },
  {
    label: "Matrículas",
    path: "/admin/matriculas",
    icon: menuIcon("MT"),
    permission: "enrollments.view",
  },
  {
    label: "Seguimiento institucional",
    path: "/admin/seguimiento",
    icon: menuIcon("SG"),
    permission: "tracking.view",
    children: [
      {
        label: "Todos",
        path: "/admin/seguimiento",
        icon: null,
        permission: "tracking.view",
      },
      {
        label: "Acciones de seguimiento",
        path: "/admin/seguimiento/acciones",
        icon: null,
        permission: "tracking.view",
      },
      {
        label: "Incidencias",
        path: "/admin/seguimiento/incidencias",
        icon: null,
        permission: "tracking.incidents.view",
      },
      {
        label: "Observaciones",
        path: "/admin/seguimiento/observaciones",
        icon: null,
        permission: "tracking.observations.view",
      },
      {
        label: "Recomendaciones IA",
        path: "/admin/seguimiento/recomendaciones-ia",
        icon: null,
        permission: "tracking.ai_recommendations.view",
      },
    ],
  },
  {
    label: "Reportes",
    path: "/admin/reportes",
    icon: menuIcon("RP"),
    permission: "reports.view",
  },
  {
    label: "Auditoría",
    path: "/admin/auditoria",
    icon: menuIcon("AU"),
    permission: "audit.view",
  },
  {
    label: "Configuración",
    path: "/admin/configuracion",
    icon: menuIcon("CF"),
    permission: "settings.view",
  },
];
