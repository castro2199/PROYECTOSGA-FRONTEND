export type SummaryReport = {
  personas: {
    estudiantes_activos: number;
    docentes_activos: number;
    apoderados_activos: number;
  };
  academico: {
    grados_activos: number;
    secciones_activas: number;
    cursos_activos: number;
    asignaciones_activas: number;
    matriculas_activas: number;
  };
  seguimiento: {
    incidencias_abiertas: number;
    incidencias_en_seguimiento: number;
    incidencias_cerradas: number;
  };
  notificaciones: Record<string, number>;
};

export type AcademicReport = {
  total_asignaciones: number;
  total_matriculas: number;
  cursos_por_docente: Array<{
    docente_id: number;
    docente__perfil__user__first_name: string;
    docente__perfil__user__last_name: string;
    total: number;
  }>;
  asignaciones_por_curso: Array<{
    curso_id: number;
    curso__nombre: string;
    total: number;
  }>;
  estudiantes_por_seccion: Array<{
    seccion_id: number;
    seccion__nombre: string;
    seccion__grado__nombre: string;
    anio_academico__anio: number;
    total: number;
  }>;
};

export type EnrollmentsReport = {
  total: number;
  por_estado: Array<{
    estado: string;
    total: number;
  }>;
  por_anio: Array<{
    anio_academico__anio: number;
    total: number;
  }>;
  por_grado: Array<{
    seccion__grado__nombre: string;
    total: number;
  }>;
  por_seccion: Array<{
    seccion_id: number;
    seccion__nombre: string;
    seccion__grado__nombre: string;
    anio_academico__anio: number;
    total: number;
  }>;
};

export type IncidentsReport = {
  total: number;
  por_tipo: Array<{
    tipo: string;
    total: number;
  }>;
  por_nivel: Array<{
    nivel: string | null;
    total: number;
  }>;
  por_estado: Array<{
    estado: string;
    total: number;
  }>;
  por_grado: Array<{
    matricula__seccion__grado__nombre: string;
    total: number;
  }>;
  por_seccion: Array<{
    matricula__seccion_id: number;
    matricula__seccion__nombre: string;
    matricula__seccion__grado__nombre: string;
    matricula__anio_academico__anio: number;
    total: number;
  }>;
};

export type NotificationsReport = {
  total: number;
  por_estado_envio: Array<{
    estado_envio: string;
    total: number;
  }>;
  por_estudiante: Array<{
    incidencia__matricula__estudiante_id: number;
    incidencia__matricula__estudiante__codigo_estudiante: string;
    incidencia__matricula__estudiante__perfil__user__first_name: string;
    incidencia__matricula__estudiante__perfil__user__last_name: string;
    total: number;
  }>;
};

export type ReportsBundle = {
  academic: AcademicReport;
  enrollments: EnrollmentsReport;
  incidents: IncidentsReport;
  notifications: NotificationsReport;
  summary: SummaryReport;
};
