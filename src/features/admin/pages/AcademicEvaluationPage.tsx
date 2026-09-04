import { useEffect, useMemo, useState } from "react";
import { PaginationControls } from "../../../shared/components/PaginationControls";
import { useClientPagination } from "../../../shared/hooks/useClientPagination";
import {
  AcademicEvaluationModal,
  type AcademicEvaluationSubmit,
} from "../components/AcademicEvaluationModal";
import { ConfirmStatusModal } from "../components/ConfirmStatusModal";
import { useAcademicEvaluation } from "../hooks/useAcademicEvaluation";
import type {
  AcademicCapacity,
  AcademicCriterion,
  AcademicEvaluationEntity,
  AcademicEvaluationEntityType,
} from "../types/academicEvaluation.types";
import {
  BASIC_ACADEMIC_STATUS_LABELS,
  basicAcademicStatusOptions,
  type BasicAcademicStatus,
} from "../types/academicStatus.types";

type Props = {
  onNavigate: (path: string) => void;
};

type StatusTarget = {
  record: AcademicEvaluationEntity;
  type: AcademicEvaluationEntityType;
};

const tabLabels: Record<AcademicEvaluationEntityType, string> = {
  competency: "Competencias",
  capacity: "Capacidades",
  criterion: "Criterios",
};

const singularLabels: Record<AcademicEvaluationEntityType, string> = {
  competency: "competencia",
  capacity: "capacidad",
  criterion: "criterio",
};

function parentLabel(
  type: AcademicEvaluationEntityType,
  record: AcademicEvaluationEntity,
) {
  if (type === "capacity") {
    return (record as AcademicCapacity).competencia_label;
  }
  if (type === "criterion") {
    const criterion = record as AcademicCriterion;
    return `${criterion.competencia_label} / ${criterion.capacidad_label}`;
  }
  return "Curso";
}

export function AcademicEvaluationPage({ onNavigate }: Props) {
  const [activeTab, setActiveTab] =
    useState<AcademicEvaluationEntityType>("competency");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [search, setSearch] = useState("");
  const [modalType, setModalType] =
    useState<AcademicEvaluationEntityType | null>(null);
  const [selectedRecord, setSelectedRecord] =
    useState<AcademicEvaluationEntity | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<StatusTarget | null>(null);
  const [statusValue, setStatusValue] = useState<BasicAcademicStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const catalog = useAcademicEvaluation();

  useEffect(() => {
    if (!selectedCourseId && catalog.courses[0]) {
      setSelectedCourseId(String(catalog.courses[0].id));
    }
  }, [catalog.courses, selectedCourseId]);

  const courseId = Number(selectedCourseId);
  const courseCompetencies = useMemo(
    () => catalog.competencies.filter((item) => item.curso === courseId),
    [catalog.competencies, courseId],
  );
  const courseCapacities = useMemo(
    () => catalog.capacities.filter((item) => item.curso_id === courseId),
    [catalog.capacities, courseId],
  );
  const courseCriteria = useMemo(
    () => catalog.criteria.filter((item) => item.curso_id === courseId),
    [catalog.criteria, courseId],
  );
  const visibleRecords = useMemo(() => {
    const source: AcademicEvaluationEntity[] =
      activeTab === "competency"
        ? courseCompetencies
        : activeTab === "capacity"
          ? courseCapacities
          : courseCriteria;
    const query = search.trim().toLocaleLowerCase("es");
    if (!query) return source;
    return source.filter((record) => {
      const parent = parentLabel(activeTab, record);
      const description =
        activeTab === "criterion"
          ? ((record as AcademicCriterion).descripcion ?? "")
          : "";
      return `${record.nombre} ${parent} ${description}`
        .toLocaleLowerCase("es")
        .includes(query);
    });
  }, [activeTab, courseCapacities, courseCompetencies, courseCriteria, search]);
  const pagination = useClientPagination(visibleRecords);

  const openCreate = () => {
    setSelectedRecord(null);
    setModalError(null);
    setModalType(activeTab);
  };

  const openEdit = (record: AcademicEvaluationEntity) => {
    setSelectedRecord(record);
    setModalError(null);
    setModalType(activeTab);
  };

  const saveRecord = async (submission: AcademicEvaluationSubmit) => {
    setModalError(null);
    try {
      if (submission.type === "competency") {
        if (selectedRecord) {
          await catalog.updateCompetency(selectedRecord.id, submission.payload);
        } else {
          await catalog.createCompetency(submission.payload);
        }
      } else if (submission.type === "capacity") {
        if (selectedRecord) {
          await catalog.updateCapacity(selectedRecord.id, submission.payload);
        } else {
          await catalog.createCapacity(submission.payload);
        }
      } else if (selectedRecord) {
        await catalog.updateCriterion(selectedRecord.id, submission.payload);
      } else {
        await catalog.createCriterion(submission.payload);
      }
      setModalType(null);
      setSelectedRecord(null);
    } catch (saveError) {
      setModalError(saveError instanceof Error ? saveError.message : "No se pudo guardar el registro.");
    }
  };

  const openStatus = (
    type: AcademicEvaluationEntityType,
    record: AcademicEvaluationEntity,
    value: BasicAcademicStatus,
  ) => {
    if (record.estado === value) return;
    setStatusTarget({ record, type });
    setStatusValue(value);
    setStatusError(null);
  };

  const confirmStatus = async () => {
    if (!statusTarget || statusValue === null) return;
    try {
      if (statusTarget.type === "competency") {
        await catalog.updateCompetency(statusTarget.record.id, { estado: statusValue });
      } else if (statusTarget.type === "capacity") {
        await catalog.updateCapacity(statusTarget.record.id, { estado: statusValue });
      } else {
        await catalog.updateCriterion(statusTarget.record.id, { estado: statusValue });
      }
      setStatusTarget(null);
      setStatusValue(null);
    } catch (saveError) {
      setStatusError(saveError instanceof Error ? saveError.message : "No se pudo cambiar el estado.");
    }
  };

  const currentCourse = catalog.courses.find((course) => course.id === courseId);
  const statusStyles: Record<number, string> = {
    0: "border-gray-200 bg-gray-100 text-gray-600",
    1: "border-success-100 bg-success-50 text-success-700",
  };

  return (
    <div className="space-y-5">
      <section className="border-b border-gray-200 pb-5">
        <button className="text-sm font-semibold text-brand-600 hover:text-brand-700" onClick={() => onNavigate("/admin/gestion-academica/cursos")} type="button">&lt; Volver a cursos</button>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-600">Gestion academica</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">Plan de evaluacion</h2>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">Organiza las competencias, capacidades y criterios que utilizaran los docentes para calificar cada curso.</p>
          </div>
          <button className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60" disabled={catalog.isLoading || catalog.isSaving} onClick={() => void catalog.reload()} type="button">{catalog.isLoading ? "Actualizando..." : "Actualizar"}</button>
        </div>
      </section>

      {catalog.error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{catalog.error}</div>}

      <section className="grid gap-4 border-b border-gray-200 pb-5 md:grid-cols-[minmax(0,1fr)_minmax(240px,360px)]">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="evaluation-course-filter">Curso</label>
          <select className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none focus:border-brand-500" id="evaluation-course-filter" onChange={(event) => { setSelectedCourseId(event.target.value); setSearch(""); }} value={selectedCourseId}>
            <option value="">Seleccionar curso</option>
            {catalog.courses.map((course) => <option key={course.id} value={course.id}>{course.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="evaluation-search">Buscar en {tabLabels[activeTab].toLowerCase()}</label>
          <input className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none focus:border-brand-500" id="evaluation-search" onChange={(event) => setSearch(event.target.value)} placeholder="Nombre o relacion" value={search} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="border-l-4 border-brand-500 bg-white px-4 py-3"><p className="text-xs font-semibold uppercase text-gray-500">Competencias</p><strong className="mt-1 block text-2xl text-gray-900">{courseCompetencies.length}</strong></div>
        <div className="border-l-4 border-green-500 bg-white px-4 py-3"><p className="text-xs font-semibold uppercase text-gray-500">Capacidades</p><strong className="mt-1 block text-2xl text-gray-900">{courseCapacities.length}</strong></div>
        <div className="border-l-4 border-amber-500 bg-white px-4 py-3"><p className="text-xs font-semibold uppercase text-gray-500">Criterios</p><strong className="mt-1 block text-2xl text-gray-900">{courseCriteria.length}</strong></div>
      </section>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex overflow-x-auto border-b border-gray-200" role="tablist">
          {(Object.keys(tabLabels) as AcademicEvaluationEntityType[]).map((tab) => (
            <button aria-selected={activeTab === tab} className={`min-w-32 border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === tab ? "border-brand-500 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-800"}`} key={tab} onClick={() => { setActiveTab(tab); setSearch(""); }} role="tab" type="button">{tabLabels[tab]}</button>
          ))}
        </div>
        <button className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60" disabled={!selectedCourseId || catalog.isLoading || catalog.isSaving} onClick={openCreate} type="button">Nueva {singularLabels[activeTab]}</button>
      </div>

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs">
        <div className="border-b border-gray-100 px-5 py-4"><h3 className="font-bold text-gray-900">{tabLabels[activeTab]}{currentCourse ? ` de ${currentCourse.nombre}` : ""}</h3></div>
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-4" scope="col">Nombre</th>{activeTab !== "competency" && <th className="px-5 py-4" scope="col">Depende de</th>}<th className="px-5 py-4" scope="col">Estado</th><th className="px-5 py-4 text-right" scope="col">Acciones</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {catalog.isLoading ? <tr><td className="px-5 py-10 text-center text-gray-500" colSpan={4}>Cargando plan de evaluacion...</td></tr> : !selectedCourseId ? <tr><td className="px-5 py-10 text-center text-gray-500" colSpan={4}>Selecciona un curso para comenzar.</td></tr> : visibleRecords.length === 0 ? <tr><td className="px-5 py-10 text-center text-gray-500" colSpan={4}>No hay {tabLabels[activeTab].toLowerCase()} para este curso.</td></tr> : pagination.pageItems.map((record) => (
                <tr className="hover:bg-gray-50" key={record.id}>
                  <td className="px-5 py-4"><p className="font-semibold text-gray-900">{record.nombre}</p>{activeTab === "criterion" && <p className="mt-1 max-w-xl text-xs text-gray-500">{(record as AcademicCriterion).descripcion || "Sin descripcion"}</p>}</td>
                  {activeTab !== "competency" && <td className="max-w-md px-5 py-4 text-gray-600">{parentLabel(activeTab, record)}</td>}
                  <td className="px-5 py-4"><select aria-label={`Cambiar estado de ${record.nombre}`} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${statusStyles[record.estado]}`} disabled={catalog.isSaving} onChange={(event) => openStatus(activeTab, record, Number(event.target.value) as BasicAcademicStatus)} value={record.estado}>{basicAcademicStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>
                  <td className="px-5 py-4 text-right"><button className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600" disabled={catalog.isSaving} onClick={() => openEdit(record)} type="button">Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationControls currentPage={pagination.currentPage} isLoading={catalog.isLoading} itemLabel={tabLabels[activeTab].toLowerCase()} onPageChange={pagination.setCurrentPage} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} />
      </section>

      {modalType && <AcademicEvaluationModal capacities={catalog.capacities} competencies={catalog.competencies} courses={catalog.courses} entityType={modalType} error={modalError} isSaving={catalog.isSaving} onClose={() => { if (!catalog.isSaving) { setModalType(null); setSelectedRecord(null); } }} onSubmit={saveRecord} record={selectedRecord} selectedCourseId={courseId || null} />}

      {statusTarget && <ConfirmStatusModal actionLabel={`cambiar el estado a ${statusValue === null ? "" : BASIC_ACADEMIC_STATUS_LABELS[statusValue]}`} entityLabel={`de ${statusTarget.record.nombre}`} error={statusError} isSaving={catalog.isSaving} onCancel={() => { if (!catalog.isSaving) { setStatusTarget(null); setStatusValue(null); setStatusError(null); } }} onConfirm={() => void confirmStatus()} />}
    </div>
  );
}
