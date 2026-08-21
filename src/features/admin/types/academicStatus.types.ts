export const ACADEMIC_LIFECYCLE_STATUS = {
  INACTIVO: 0,
  PLANIFICADO: 1,
  ACTIVO: 2,
  CERRADO: 3,
} as const;

export type AcademicLifecycleStatus =
  (typeof ACADEMIC_LIFECYCLE_STATUS)[keyof typeof ACADEMIC_LIFECYCLE_STATUS];

export const ACADEMIC_LIFECYCLE_STATUS_LABELS: Record<
  AcademicLifecycleStatus,
  string
> = {
  [ACADEMIC_LIFECYCLE_STATUS.INACTIVO]: "Inactivo",
  [ACADEMIC_LIFECYCLE_STATUS.PLANIFICADO]: "Planificado",
  [ACADEMIC_LIFECYCLE_STATUS.ACTIVO]: "Activo",
  [ACADEMIC_LIFECYCLE_STATUS.CERRADO]: "Cerrado",
};

export const BASIC_ACADEMIC_STATUS = {
  INACTIVO: 0,
  ACTIVO: 1,
} as const;

export type BasicAcademicStatus =
  (typeof BASIC_ACADEMIC_STATUS)[keyof typeof BASIC_ACADEMIC_STATUS];

export const BASIC_ACADEMIC_STATUS_LABELS: Record<BasicAcademicStatus, string> =
  {
    [BASIC_ACADEMIC_STATUS.INACTIVO]: "Inactivo",
    [BASIC_ACADEMIC_STATUS.ACTIVO]: "Activo",
  };

export const COURSE_ASSIGNMENT_STATUS = {
  INACTIVO: 0,
  ACTIVO: 1,
  FINALIZADO: 2,
} as const;

export type CourseAssignmentStatus =
  (typeof COURSE_ASSIGNMENT_STATUS)[keyof typeof COURSE_ASSIGNMENT_STATUS];

export const COURSE_ASSIGNMENT_STATUS_LABELS: Record<
  CourseAssignmentStatus,
  string
> = {
  [COURSE_ASSIGNMENT_STATUS.INACTIVO]: "Inactivo",
  [COURSE_ASSIGNMENT_STATUS.ACTIVO]: "Activo",
  [COURSE_ASSIGNMENT_STATUS.FINALIZADO]: "Finalizado",
};

export const courseAssignmentStatusOptions: StatusOption<CourseAssignmentStatus>[] =
  [
    {
      label: COURSE_ASSIGNMENT_STATUS_LABELS[COURSE_ASSIGNMENT_STATUS.INACTIVO],
      value: COURSE_ASSIGNMENT_STATUS.INACTIVO,
    },
    {
      label: COURSE_ASSIGNMENT_STATUS_LABELS[COURSE_ASSIGNMENT_STATUS.ACTIVO],
      value: COURSE_ASSIGNMENT_STATUS.ACTIVO,
    },
    {
      label:
        COURSE_ASSIGNMENT_STATUS_LABELS[COURSE_ASSIGNMENT_STATUS.FINALIZADO],
      value: COURSE_ASSIGNMENT_STATUS.FINALIZADO,
    },
  ];

export type StatusOption<TStatus extends number> = {
  label: string;
  value: TStatus;
};

export const academicLifecycleStatusOptions: StatusOption<AcademicLifecycleStatus>[] =
  [
    {
      label: ACADEMIC_LIFECYCLE_STATUS_LABELS[
        ACADEMIC_LIFECYCLE_STATUS.INACTIVO
      ],
      value: ACADEMIC_LIFECYCLE_STATUS.INACTIVO,
    },
    {
      label: ACADEMIC_LIFECYCLE_STATUS_LABELS[
        ACADEMIC_LIFECYCLE_STATUS.PLANIFICADO
      ],
      value: ACADEMIC_LIFECYCLE_STATUS.PLANIFICADO,
    },
    {
      label: ACADEMIC_LIFECYCLE_STATUS_LABELS[ACADEMIC_LIFECYCLE_STATUS.ACTIVO],
      value: ACADEMIC_LIFECYCLE_STATUS.ACTIVO,
    },
    {
      label: ACADEMIC_LIFECYCLE_STATUS_LABELS[ACADEMIC_LIFECYCLE_STATUS.CERRADO],
      value: ACADEMIC_LIFECYCLE_STATUS.CERRADO,
    },
  ];

export const basicAcademicStatusOptions: StatusOption<BasicAcademicStatus>[] = [
  {
    label: BASIC_ACADEMIC_STATUS_LABELS[BASIC_ACADEMIC_STATUS.INACTIVO],
    value: BASIC_ACADEMIC_STATUS.INACTIVO,
  },
  {
    label: BASIC_ACADEMIC_STATUS_LABELS[BASIC_ACADEMIC_STATUS.ACTIVO],
    value: BASIC_ACADEMIC_STATUS.ACTIVO,
  },
];
