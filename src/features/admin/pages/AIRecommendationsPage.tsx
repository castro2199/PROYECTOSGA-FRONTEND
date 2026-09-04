import { useMemo, useState } from "react";
import { PaginationControls } from "../../../shared/components/PaginationControls";
import { useClientPagination } from "../../../shared/hooks/useClientPagination";
import { AIRecommendationModal } from "../components/AIRecommendationModal";
import { ConfirmStatusModal } from "../components/ConfirmStatusModal";
import { GenerateAIRecommendationModal } from "../components/GenerateAIRecommendationModal";
import { useAcademicPeriods } from "../hooks/useAcademicPeriods";
import { useAIRecommendations } from "../hooks/useAIRecommendations";
import { useCourseAssignments } from "../hooks/useCourseAssignments";
import { useEnrollments } from "../hooks/useEnrollments";
import { useTeachers } from "../hooks/useTeachers";
import { COURSE_ASSIGNMENT_STATUS } from "../types/academicStatus.types";
import type {
  AIRecommendation,
  AIRecommendationPayload,
  AIRecommendationReviewStatus,
  GenerateAIRecommendationPayload,
} from "../types/aiRecommendation.types";
import {
  aiRecommendationActiveOptions,
  aiRecommendationReviewStatusLabels,
  aiRecommendationReviewStatusOptions,
} from "../types/aiRecommendation.types";

type AIRecommendationsPageProps = {
  token: string;
};

type ReviewAction = {
  label: string;
  status: AIRecommendationReviewStatus;
};

type ActiveAction = {
  active: boolean;
  label: string;
};

const reviewStatusStyles: Record<AIRecommendationReviewStatus, string> = {
  PENDIENTE: "border-warning-100 bg-warning-50 text-warning-700",
  APROBADA: "border-success-100 bg-success-50 text-success-700",
  RECHAZADA: "border-red-100 bg-red-50 text-red-700",
  EDITADA: "border-brand-100 bg-brand-50 text-brand-700",
};

const activeStyles: Record<string, string> = {
  active: "border-success-100 bg-success-50 text-success-700",
  inactive: "border-red-100 bg-red-50 text-red-700",
};

function getReviewActionLabel(status: AIRecommendationReviewStatus) {
  const label = aiRecommendationReviewStatusLabels[status] ?? "estado";

  return `cambiar la revision a ${label}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function AIRecommendationsPage({ token }: AIRecommendationsPageProps) {
  const [activeAction, setActiveAction] = useState<ActiveAction | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [activeTarget, setActiveTarget] = useState<AIRecommendation | null>(
    null,
  );
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewFilter, setReviewFilter] =
    useState<AIRecommendationReviewStatus | null>(null);
  const [reviewTarget, setReviewTarget] = useState<AIRecommendation | null>(
    null,
  );
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<AIRecommendation | null>(null);

  const {
    addRecommendation,
    editRecommendation,
    error,
    generateRecommendation,
    isLoading,
    isSaving,
    recommendations,
    reload,
  } = useAIRecommendations(token);
  const {
    academicPeriods,
    error: periodsError,
    isLoading: isLoadingPeriods,
    reload: reloadPeriods,
  } = useAcademicPeriods(token);
  const {
    courseAssignments,
    error: assignmentsError,
    isLoading: isLoadingAssignments,
    reload: reloadAssignments,
  } = useCourseAssignments(token);
  const {
    enrollments,
    error: enrollmentsError,
    isLoading: isLoadingEnrollments,
    reload: reloadEnrollments,
  } = useEnrollments(token);
  const {
    error: teachersError,
    isLoading: isLoadingTeachers,
    reload: reloadTeachers,
    teachers,
  } = useTeachers(token);

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((recommendation) => {
      const matchesReview = reviewFilter
        ? recommendation.estado_revision === reviewFilter
        : true;
      const matchesActive =
        activeFilter === ""
          ? true
          : recommendation.activo === (activeFilter === "true");

      return matchesReview && matchesActive;
    });
  }, [activeFilter, recommendations, reviewFilter]);
  const pagination = useClientPagination(filteredRecommendations);
  const isCatalogLoading =
    isLoadingPeriods ||
    isLoadingAssignments ||
    isLoadingEnrollments ||
    isLoadingTeachers;
  const isBusy = isLoading || isSaving || isCatalogLoading;
  const catalogError =
    periodsError ?? assignmentsError ?? enrollmentsError ?? teachersError;
  const activeEnrollments = enrollments.filter(
    (enrollment) => enrollment.estado === "ACTIVA",
  );
  const activeAssignments = courseAssignments.filter(
    (assignment) => assignment.estado === COURSE_ASSIGNMENT_STATUS.ACTIVO,
  );
  const canCreate = activeEnrollments.length > 0;
  const canGenerate = canCreate && activeAssignments.length > 0;

  const handleSubmit = async (payload: AIRecommendationPayload) => {
    setModalError(null);

    try {
      if (selectedRecommendation) {
        await editRecommendation(selectedRecommendation.id, payload);
      } else {
        await addRecommendation(payload);
      }
      setIsModalOpen(false);
      setSelectedRecommendation(null);
    } catch (saveError) {
      setModalError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar la recomendacion IA.",
      );
    }
  };

  const reloadAll = () => {
    void reload();
    void reloadPeriods();
    void reloadAssignments();
    void reloadEnrollments();
    void reloadTeachers();
  };

  const handleGenerate = async (payload: GenerateAIRecommendationPayload) => {
    setGenerateError(null);

    try {
      await generateRecommendation(payload);
      setIsGenerateModalOpen(false);
    } catch (saveError) {
      setGenerateError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo generar la recomendacion IA.",
      );
    }
  };

  const openCreateModal = () => {
    setSelectedRecommendation(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openGenerateModal = () => {
    setGenerateError(null);
    setIsGenerateModalOpen(true);
  };

  const openEditModal = (recommendation: AIRecommendation) => {
    setSelectedRecommendation(recommendation);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openReviewModal = (
    recommendation: AIRecommendation,
    status: AIRecommendationReviewStatus,
  ) => {
    if (recommendation.estado_revision === status) return;

    setReviewTarget(recommendation);
    setReviewAction({
      label: getReviewActionLabel(status),
      status,
    });
    setReviewError(null);
  };

  const openActiveModal = (
    recommendation: AIRecommendation,
    active: boolean,
  ) => {
    if (recommendation.activo === active) return;

    setActiveTarget(recommendation);
    setActiveAction({
      active,
      label: active ? "activar" : "desactivar",
    });
    setReviewError(null);
  };

  const confirmReviewChange = async () => {
    if (!reviewTarget || !reviewAction) return;
    setReviewError(null);

    try {
      await editRecommendation(reviewTarget.id, {
        estado_revision: reviewAction.status,
      });
      setReviewTarget(null);
      setReviewAction(null);
    } catch (saveError) {
      setReviewError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo cambiar la revision.",
      );
    }
  };

  const confirmActiveChange = async () => {
    if (!activeTarget || !activeAction) return;
    setReviewError(null);

    try {
      await editRecommendation(activeTarget.id, {
        activo: activeAction.active,
      });
      setActiveTarget(null);
      setActiveAction(null);
    } catch (saveError) {
      setReviewError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo cambiar el estado de la recomendacion.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-600">Seguimiento</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Recomendaciones IA
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Administra recomendaciones generadas con IA para apoyar el
            seguimiento academico y socioemocional de los estudiantes.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isBusy}
            onClick={reloadAll}
            type="button"
          >
            {isLoading || isCatalogLoading ? "Actualizando..." : "Actualizar"}
          </button>
          <select
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
            disabled={isBusy}
            onChange={(event) =>
              setReviewFilter(
                event.target.value === ""
                  ? null
                  : (event.target.value as AIRecommendationReviewStatus),
              )
            }
            value={reviewFilter ?? ""}
          >
            <option value="">Revision</option>
            {aiRecommendationReviewStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
            disabled={isBusy}
            onChange={(event) => setActiveFilter(event.target.value)}
            value={activeFilter}
          >
            <option value="">Todos</option>
            {aiRecommendationActiveOptions.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isBusy || !canGenerate}
            onClick={openGenerateModal}
            type="button"
          >
            <img
              alt=""
              className="h-4 w-4 brightness-0 invert"
              src="/admin-icons/plug-in.svg"
            />
            Generar con IA
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isBusy || !canCreate}
            onClick={openCreateModal}
            type="button"
          >
            <img
              alt=""
              className="h-4 w-4"
              src="/admin-icons/plus.svg"
            />
            Manual
          </button>
        </div>
      </section>

      {(error || catalogError) && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? catalogError}
        </div>
      )}

      {!canGenerate && !isCatalogLoading && (
        <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          Para generar una recomendacion IA necesitas al menos una matricula
          activa y una asignacion de curso activa.
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">Listado</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px] text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Codigo</th>
                <th className="px-6 py-4 font-semibold">Estudiante</th>
                <th className="px-6 py-4 font-semibold">Periodo</th>
                <th className="px-6 py-4 font-semibold">Revisor</th>
                <th className="px-6 py-4 font-semibold">Generacion</th>
                <th className="px-6 py-4 font-semibold">Revision</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={8}>
                    Cargando recomendaciones...
                  </td>
                </tr>
              ) : filteredRecommendations.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={8}>
                    No hay recomendaciones IA registradas.
                  </td>
                </tr>
              ) : (
                pagination.pageItems.map((recommendation) => (
                  <tr className="hover:bg-gray-50" key={recommendation.id}>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {recommendation.estudiante_codigo}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="max-w-sm">
                        <p className="font-semibold text-gray-900">
                          {recommendation.estudiante_label}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {recommendation.seccion_label}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                          {recommendation.texto_revisado ??
                            recommendation.texto_generado}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {recommendation.periodo_academico_label ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {recommendation.docente_revisor_label ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDateTime(recommendation.fecha_generacion)}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        aria-label={`Cambiar revision de recomendacion ${recommendation.id}`}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:cursor-not-allowed disabled:opacity-70 ${
                          reviewStatusStyles[recommendation.estado_revision]
                        }`}
                        disabled={isSaving}
                        onChange={(event) =>
                          openReviewModal(
                            recommendation,
                            event.target.value as AIRecommendationReviewStatus,
                          )
                        }
                        value={recommendation.estado_revision}
                      >
                        {aiRecommendationReviewStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        aria-label={`Cambiar estado de recomendacion ${recommendation.id}`}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:cursor-not-allowed disabled:opacity-70 ${
                          recommendation.activo
                            ? activeStyles.active
                            : activeStyles.inactive
                        }`}
                        disabled={isSaving}
                        onChange={(event) =>
                          openActiveModal(
                            recommendation,
                            event.target.value === "true",
                          )
                        }
                        value={String(recommendation.activo)}
                      >
                        {aiRecommendationActiveOptions.map((option) => (
                          <option
                            key={String(option.value)}
                            value={String(option.value)}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={isSaving}
                          onClick={() => openEditModal(recommendation)}
                          type="button"
                        >
                          <img
                            alt=""
                            className="h-4 w-4"
                            src="/admin-icons/pencil.svg"
                          />
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls currentPage={pagination.currentPage} isLoading={isLoading} itemLabel="recomendaciones" onPageChange={pagination.setCurrentPage} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} />
      </section>

      {isModalOpen && (
        <AIRecommendationModal
          academicPeriods={academicPeriods}
          enrollments={enrollments}
          error={modalError}
          isSaving={isSaving}
          onClose={() => {
            if (!isSaving) {
              setIsModalOpen(false);
              setSelectedRecommendation(null);
            }
          }}
          onSubmit={handleSubmit}
          recommendation={selectedRecommendation}
          teachers={teachers}
        />
      )}

      {isGenerateModalOpen && (
        <GenerateAIRecommendationModal
          academicPeriods={academicPeriods}
          courseAssignments={courseAssignments}
          enrollments={enrollments}
          error={generateError}
          isSaving={isSaving}
          onClose={() => {
            if (!isSaving) {
              setIsGenerateModalOpen(false);
              setGenerateError(null);
            }
          }}
          onSubmit={handleGenerate}
        />
      )}

      {reviewTarget && (
        <ConfirmStatusModal
          actionLabel={reviewAction?.label ?? "cambiar revision"}
          entityLabel={`de la recomendacion ${reviewTarget.id}`}
          error={reviewError}
          isSaving={isSaving}
          onCancel={() => {
            if (!isSaving) {
              setReviewTarget(null);
              setReviewAction(null);
              setReviewError(null);
            }
          }}
          onConfirm={() => void confirmReviewChange()}
        />
      )}

      {activeTarget && (
        <ConfirmStatusModal
          actionLabel={activeAction?.label ?? "cambiar estado"}
          entityLabel={`de la recomendacion ${activeTarget.id}`}
          error={reviewError}
          isSaving={isSaving}
          onCancel={() => {
            if (!isSaving) {
              setActiveTarget(null);
              setActiveAction(null);
              setReviewError(null);
            }
          }}
          onConfirm={() => void confirmActiveChange()}
        />
      )}
    </div>
  );
}
