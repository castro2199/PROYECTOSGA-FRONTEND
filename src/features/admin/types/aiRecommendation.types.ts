export type AIRecommendationReviewStatus =
  | "PENDIENTE"
  | "APROBADA"
  | "RECHAZADA"
  | "EDITADA";

export type AIRecommendation = {
  id: number;
  matricula: number;
  estudiante_label: string;
  estudiante_codigo: string;
  seccion_label: string;
  periodo_academico: number | null;
  periodo_academico_label: string | null;
  revisado_por_docente: number | null;
  docente_revisor_label: string | null;
  resumen_contexto: string;
  texto_generado: string;
  texto_revisado: string | null;
  estado_revision: AIRecommendationReviewStatus;
  fecha_generacion: string;
  fecha_revision: string | null;
  activo: boolean;
};

export type AIRecommendationPayload = {
  matricula: number;
  periodo_academico: number | null;
  revisado_por_docente: number | null;
  resumen_contexto: string;
  texto_generado: string;
  texto_revisado: string | null;
  estado_revision: AIRecommendationReviewStatus;
  fecha_generacion: string;
  activo: boolean;
};

export type AIRecommendationUpdatePayload = Partial<AIRecommendationPayload>;

export type GenerateAIRecommendationPayload = {
  matricula: number;
  asignacion_curso: number;
  periodo_academico: number | null;
};

export type PaginatedAIRecommendationResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AIRecommendation[];
};

export const aiRecommendationReviewStatusLabels: Record<
  AIRecommendationReviewStatus,
  string
> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  EDITADA: "Editada",
};

export const aiRecommendationReviewStatusOptions: Array<{
  label: string;
  value: AIRecommendationReviewStatus;
}> = [
  { label: aiRecommendationReviewStatusLabels.PENDIENTE, value: "PENDIENTE" },
  { label: aiRecommendationReviewStatusLabels.APROBADA, value: "APROBADA" },
  { label: aiRecommendationReviewStatusLabels.RECHAZADA, value: "RECHAZADA" },
  { label: aiRecommendationReviewStatusLabels.EDITADA, value: "EDITADA" },
];

export const aiRecommendationActiveOptions = [
  { label: "Activo", value: true },
  { label: "Inactivo", value: false },
];
