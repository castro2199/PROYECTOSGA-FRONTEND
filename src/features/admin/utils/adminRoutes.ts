const routeAliases: Record<string, string> = {
  "/auditoria": "/admin/auditoria",
  "/configuracion": "/admin/configuracion",
  "/dashboard": "/admin",
  "/gestion-academica/anios": "/admin/gestion-academica/anios",
  "/gestion-academica/anios-academicos": "/admin/gestion-academica/anios",
  "/gestion-academica/asignaciones": "/admin/gestion-academica/asignaciones",
  "/gestion-academica/asignaciones-cursos":
    "/admin/gestion-academica/asignaciones",
  "/gestion-academica/cursos": "/admin/gestion-academica/cursos",
  "/gestion-academica/competencias":
    "/admin/gestion-academica/evaluacion",
  "/gestion-academica/capacidades":
    "/admin/gestion-academica/evaluacion",
  "/gestion-academica/criterios":
    "/admin/gestion-academica/evaluacion",
  "/gestion-academica/criterios-calificacion":
    "/admin/gestion-academica/evaluacion",
  "/gestion-academica/evaluacion":
    "/admin/gestion-academica/evaluacion",
  "/admin/gestion-academica/competencias":
    "/admin/gestion-academica/evaluacion",
  "/admin/gestion-academica/capacidades":
    "/admin/gestion-academica/evaluacion",
  "/admin/gestion-academica/criterios":
    "/admin/gestion-academica/evaluacion",
  "/admin/gestion-academica/criterios-calificacion":
    "/admin/gestion-academica/evaluacion",
  "/gestion-academica/grados-secciones":
    "/admin/gestion-academica/grados-secciones",
  "/gestion-academica/periodos": "/admin/gestion-academica/periodos",
  "/matriculas": "/admin/matriculas",
  "/reportes": "/admin/reportes",
  "/seguimiento/incidencias": "/admin/seguimiento/incidencias",
  "/seguimiento": "/admin/seguimiento",
  "/seguimiento/acciones": "/admin/seguimiento/acciones",
  "/seguimiento/institucional": "/admin/seguimiento",
  "/seguimiento/notificaciones": "/admin/seguimiento/notificaciones",
  "/seguimiento/observaciones": "/admin/seguimiento/observaciones",
  "/notificaciones": "/admin/seguimiento/notificaciones",
  "/seguimiento/recomendaciones-ia":
    "/admin/seguimiento/recomendaciones-ia",
  "/usuarios/apoderados": "/admin/usuarios/apoderados",
  "/usuarios/docentes": "/admin/usuarios/docentes",
  "/usuarios/estudiantes": "/admin/usuarios/estudiantes",
  "/usuarios/roles": "/admin/usuarios/roles",
};

export function normalizeAdminPath(path: string) {
  const pathWithSlash = path.startsWith("/") ? path : `/${path}`;
  const normalizedPath = pathWithSlash.replace(/\/+$/, "") || "/";

  return routeAliases[normalizedPath] ?? normalizedPath;
}
