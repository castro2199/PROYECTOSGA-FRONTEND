import { useState } from "react";
import { AcademicGradeModal } from "../components/AcademicGradeModal";
import { AcademicSectionModal } from "../components/AcademicSectionModal";
import { ConfirmStatusModal } from "../components/ConfirmStatusModal";
import { useAcademicGrades } from "../hooks/useAcademicGrades";
import { useAcademicSections } from "../hooks/useAcademicSections";
import {
  BASIC_ACADEMIC_STATUS_LABELS,
  basicAcademicStatusOptions,
  type BasicAcademicStatus,
} from "../types/academicStatus.types";
import type {
  AcademicGrade,
  AcademicGradePayload,
  AcademicSection,
  AcademicSectionPayload,
} from "../types/academicCatalog.types";

type AcademicGradesSectionsPageProps = {
  token: string;
};

type StatusAction = {
  label: string;
  status: BasicAcademicStatus;
};

type StatusTarget =
  | {
      record: AcademicGrade;
      type: "grade";
    }
  | {
      record: AcademicSection;
      type: "section";
    };

const statusStyles = {
  0: "border-gray-200 bg-gray-100 text-gray-600",
  1: "border-success-100 bg-success-50 text-success-700",
};

function getStatusActionLabel(status: BasicAcademicStatus) {
  const label = BASIC_ACADEMIC_STATUS_LABELS[status] ?? "estado";

  return `cambiar el estado a ${label}`;
}

export function AcademicGradesSectionsPage({
  token,
}: AcademicGradesSectionsPageProps) {
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<AcademicGrade | null>(
    null,
  );
  const [selectedSection, setSelectedSection] =
    useState<AcademicSection | null>(null);
  const [gradeFilter, setGradeFilter] = useState<BasicAcademicStatus | null>(
    null,
  );
  const [sectionFilter, setSectionFilter] = useState<BasicAcademicStatus | null>(
    null,
  );
  const [gradeModalError, setGradeModalError] = useState<string | null>(null);
  const [sectionModalError, setSectionModalError] = useState<string | null>(
    null,
  );
  const [statusTarget, setStatusTarget] = useState<StatusTarget | null>(null);
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const {
    academicGrades,
    addAcademicGrade,
    editAcademicGrade,
    error: gradeError,
    isLoading: isLoadingGrades,
    isSaving: isSavingGrade,
    reload: reloadGrades,
  } = useAcademicGrades(token, {
    estado: gradeFilter,
  });

  const {
    academicSections,
    addAcademicSection,
    editAcademicSection,
    error: sectionError,
    isLoading: isLoadingSections,
    isSaving: isSavingSection,
    reload: reloadSections,
  } = useAcademicSections(token, {
    estado: sectionFilter,
  });

  const isSaving = isSavingGrade || isSavingSection;
  const isBusy = isLoadingGrades || isLoadingSections || isSaving;

  const handleGradeSubmit = async (payload: AcademicGradePayload) => {
    setGradeModalError(null);

    try {
      if (selectedGrade) {
        await editAcademicGrade(selectedGrade.id, payload);
        await reloadSections();
      } else {
        await addAcademicGrade(payload);
      }
      setIsGradeModalOpen(false);
      setSelectedGrade(null);
    } catch (saveError) {
      setGradeModalError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar el grado.",
      );
    }
  };

  const handleSectionSubmit = async (payload: AcademicSectionPayload) => {
    setSectionModalError(null);

    try {
      if (selectedSection) {
        await editAcademicSection(selectedSection.id, payload);
      } else {
        await addAcademicSection(payload);
      }
      setIsSectionModalOpen(false);
      setSelectedSection(null);
    } catch (saveError) {
      setSectionModalError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar la seccion.",
      );
    }
  };

  const openCreateGradeModal = () => {
    setSelectedGrade(null);
    setGradeModalError(null);
    setIsGradeModalOpen(true);
  };

  const openEditGradeModal = (grade: AcademicGrade) => {
    setSelectedGrade(grade);
    setGradeModalError(null);
    setIsGradeModalOpen(true);
  };

  const openCreateSectionModal = () => {
    setSelectedSection(null);
    setSectionModalError(null);
    setIsSectionModalOpen(true);
  };

  const openEditSectionModal = (section: AcademicSection) => {
    setSelectedSection(section);
    setSectionModalError(null);
    setIsSectionModalOpen(true);
  };

  const openStatusModal = (
    target: StatusTarget,
    status: BasicAcademicStatus,
  ) => {
    if (target.record.estado === status) return;

    setStatusTarget(target);
    setStatusAction({
      label: getStatusActionLabel(status),
      status,
    });
    setStatusError(null);
  };

  const confirmStatusChange = async () => {
    if (!statusTarget || !statusAction) return;
    setStatusError(null);

    try {
      if (statusTarget.type === "grade") {
        await editAcademicGrade(statusTarget.record.id, {
          estado: statusAction.status,
        });
        await reloadSections();
      } else {
        await editAcademicSection(statusTarget.record.id, {
          estado: statusAction.status,
        });
      }

      setStatusTarget(null);
      setStatusAction(null);
    } catch (saveError) {
      setStatusError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo cambiar el estado.",
      );
    }
  };

  const statusEntityLabel =
    statusTarget?.type === "grade"
      ? `del grado ${statusTarget.record.nombre}`
      : statusTarget?.type === "section"
        ? `de la seccion ${statusTarget.record.nombre}`
        : "";

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-600">
            Gestion academica
          </p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Grados y secciones
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Organiza la estructura de grados y sus secciones para matriculas,
            cursos y seguimiento estudiantil.
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isBusy}
          onClick={() => {
            void reloadGrades();
            void reloadSections();
          }}
          type="button"
        >
          {isLoadingGrades || isLoadingSections ? "Actualizando..." : "Actualizar"}
        </button>
      </section>

      {(gradeError || sectionError) && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {gradeError ?? sectionError}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Grados</h3>
            <p className="mt-1 text-sm text-gray-500">
              Define los grados academicos disponibles.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
              disabled={isBusy}
              onChange={(event) =>
                setGradeFilter(
                  event.target.value === ""
                    ? null
                    : (Number(event.target.value) as BasicAcademicStatus),
                )
              }
              value={gradeFilter ?? ""}
            >
              <option value="">Todos</option>
              {basicAcademicStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isBusy}
              onClick={openCreateGradeModal}
              type="button"
            >
              <img
                alt=""
                className="h-4 w-4 brightness-0 invert"
                src="/admin-icons/plus.svg"
              />
              Nuevo grado
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Grado</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoadingGrades ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={3}>
                    Cargando grados...
                  </td>
                </tr>
              ) : academicGrades.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={3}>
                    No hay grados registrados.
                  </td>
                </tr>
              ) : (
                academicGrades.map((grade) => (
                  <tr className="hover:bg-gray-50" key={grade.id}>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {grade.nombre}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        aria-label={`Cambiar estado del grado ${grade.nombre}`}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:cursor-not-allowed disabled:opacity-70 ${
                          statusStyles[grade.estado] ??
                          "border-gray-200 bg-gray-100 text-gray-600"
                        }`}
                        disabled={isSaving}
                        onChange={(event) =>
                          openStatusModal(
                            {
                              record: grade,
                              type: "grade",
                            },
                            Number(event.target.value) as BasicAcademicStatus,
                          )
                        }
                        value={grade.estado}
                      >
                        {basicAcademicStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
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
                          onClick={() => openEditGradeModal(grade)}
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
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Secciones</h3>
            <p className="mt-1 text-sm text-gray-500">
              Vincula secciones a cada grado academico.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
              disabled={isBusy}
              onChange={(event) =>
                setSectionFilter(
                  event.target.value === ""
                    ? null
                    : (Number(event.target.value) as BasicAcademicStatus),
                )
              }
              value={sectionFilter ?? ""}
            >
              <option value="">Todos</option>
              {basicAcademicStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isBusy || academicGrades.length === 0}
              onClick={openCreateSectionModal}
              type="button"
            >
              <img
                alt=""
                className="h-4 w-4 brightness-0 invert"
                src="/admin-icons/plus.svg"
              />
              Nueva seccion
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Seccion</th>
                <th className="px-6 py-4 font-semibold">Grado</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoadingSections ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={4}>
                    Cargando secciones...
                  </td>
                </tr>
              ) : academicSections.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={4}>
                    No hay secciones registradas.
                  </td>
                </tr>
              ) : (
                academicSections.map((section) => (
                  <tr className="hover:bg-gray-50" key={section.id}>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {section.nombre}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {section.grado_label}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        aria-label={`Cambiar estado de la seccion ${section.nombre}`}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:cursor-not-allowed disabled:opacity-70 ${
                          statusStyles[section.estado] ??
                          "border-gray-200 bg-gray-100 text-gray-600"
                        }`}
                        disabled={isSaving}
                        onChange={(event) =>
                          openStatusModal(
                            {
                              record: section,
                              type: "section",
                            },
                            Number(event.target.value) as BasicAcademicStatus,
                          )
                        }
                        value={section.estado}
                      >
                        {basicAcademicStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
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
                          onClick={() => openEditSectionModal(section)}
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
      </section>

      {isGradeModalOpen && (
        <AcademicGradeModal
          academicGrade={selectedGrade}
          error={gradeModalError}
          isSaving={isSavingGrade}
          onClose={() => {
            if (!isSavingGrade) {
              setIsGradeModalOpen(false);
              setSelectedGrade(null);
            }
          }}
          onSubmit={handleGradeSubmit}
        />
      )}

      {isSectionModalOpen && (
        <AcademicSectionModal
          academicGrades={academicGrades}
          academicSection={selectedSection}
          error={sectionModalError}
          isSaving={isSavingSection}
          onClose={() => {
            if (!isSavingSection) {
              setIsSectionModalOpen(false);
              setSelectedSection(null);
            }
          }}
          onSubmit={handleSectionSubmit}
        />
      )}

      {statusTarget && (
        <ConfirmStatusModal
          actionLabel={statusAction?.label ?? "Cambiar estado"}
          entityLabel={statusEntityLabel}
          error={statusError}
          isSaving={isSaving}
          onCancel={() => {
            if (!isSaving) {
              setStatusTarget(null);
              setStatusAction(null);
              setStatusError(null);
            }
          }}
          onConfirm={() => void confirmStatusChange()}
        />
      )}
    </div>
  );
}
