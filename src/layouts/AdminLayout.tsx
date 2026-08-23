import { useMemo, useState } from "react";
import { useAuth } from "../features/auth/hooks/useAuth";
import { AdminHeader } from "../features/admin/components/AdminHeader";
import { AdminSidebar } from "../features/admin/components/AdminSidebar";
import { AdminDashboardPage } from "../features/admin/pages/AdminDashboardPage";
import { AcademicYearsPage } from "../features/admin/pages/AcademicYearsPage";
import { AcademicPeriodsPage } from "../features/admin/pages/AcademicPeriodsPage";
import { AcademicGradesSectionsPage } from "../features/admin/pages/AcademicGradesSectionsPage";
import { AcademicCoursesPage } from "../features/admin/pages/AcademicCoursesPage";
import { CourseAssignmentsPage } from "../features/admin/pages/CourseAssignmentsPage";
import { StudentsPage } from "../features/admin/pages/StudentsPage";
import { TeachersPage } from "../features/admin/pages/TeachersPage";
import { GuardiansPage } from "../features/admin/pages/GuardiansPage";
import { UserRolesPage } from "../features/admin/pages/UserRolesPage";
import { EnrollmentsPage } from "../features/admin/pages/EnrollmentsPage";
import { IncidentsPage } from "../features/admin/pages/IncidentsPage";
import { ObservationsPage } from "../features/admin/pages/ObservationsPage";
import { AIRecommendationsPage } from "../features/admin/pages/AIRecommendationsPage";
import { ReportsPage } from "../features/admin/pages/ReportsPage";
import { AuditPage } from "../features/admin/pages/AuditPage";
import { SettingsPage } from "../features/admin/pages/SettingsPage";
import { TeacherModulePage } from "../features/teacher/pages/TeacherModulePage";
import {
  TeacherCourseWorkspacePage,
  type TeacherCourseSection,
} from "../features/teacher/pages/TeacherCourseWorkspacePage";
import type { TeacherModuleKey } from "../features/teacher/services/teacherService";
import { StudentModulePage } from "../features/student/pages/StudentModulePage";
import type { StudentModuleKey } from "../features/student/services/studentService";
import {
  StudentCourseWorkspacePage,
  type StudentCourseSection,
} from "../features/student/pages/StudentCourseWorkspacePage";
import { GuardianModulePage } from "../features/guardian/pages/GuardianModulePage";
import type { GuardianModuleKey } from "../features/guardian/services/guardianService";
import { GuardianStudentWorkspacePage } from "../features/guardian/pages/GuardianStudentWorkspacePage";
import {
  GuardianCourseWorkspacePage,
  type GuardianCourseSection,
} from "../features/guardian/pages/GuardianCourseWorkspacePage";
import { GuardianPageErrorBoundary } from "../features/guardian/components/GuardianPageErrorBoundary";
import type { AuthMenuItem } from "../features/auth/types/auth.types";
import { normalizeAdminPath } from "../features/admin/utils/adminRoutes";

type AdminLayoutProps = {
  currentPath: string;
  onNavigate: (path: string) => void;
};

function normalizePath(path: string) {
  return normalizeAdminPath(path);
}

function menuItemPath(item: AuthMenuItem) {
  const path = item.path ?? item.route ?? item.url ?? item.href;
  if (!path) return null;
  return normalizePath(path);
}

function findMenuItem(
  items: AuthMenuItem[],
  currentPath: string,
): AuthMenuItem | null {
  const normalizedCurrentPath = normalizePath(currentPath);

  for (const item of items) {
    if (menuItemPath(item) === normalizedCurrentPath) return item;

    const child = findMenuItem(item.children ?? item.items ?? [], currentPath);
    if (child) return child;
  }

  return null;
}

function isDashboardItem(item: AuthMenuItem | null) {
  if (!item) return false;
  const label = item.label ?? item.title ?? item.name ?? "";
  return label.trim().toLowerCase() === "dashboard";
}

function menuItemLabel(item: AuthMenuItem | null) {
  return item?.label ?? item?.title ?? item?.name ?? "";
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function teacherModuleFromMenuItem(
  item: AuthMenuItem | null,
): TeacherModuleKey | null {
  const label = normalizeText(menuItemLabel(item));

  if (label === "mis cursos") return "courses";
  if (label === "asistencia") return "attendance";
  if (label === "calificaciones") return "grades";
  if (label === "participaciones") return "participations";
  if (label === "observaciones") return "observations";
  if (label === "seguimiento estudiantil") return "tracking";
  if (label === "recomendaciones ia") return "recommendations";
  if (label === "reportes") return "reports";

  return null;
}

function teacherModuleFromPath(path: string): TeacherModuleKey | null {
  const normalizedPath = normalizeText(path);

  if (normalizedPath.includes("mis-cursos")) return "courses";
  if (normalizedPath.includes("asistencia")) return "attendance";
  if (normalizedPath.includes("calificaciones")) return "grades";
  if (normalizedPath.includes("participaciones")) return "participations";
  if (normalizedPath.includes("observaciones")) return "observations";
  if (normalizedPath.includes("seguimiento-estudiantil")) return "tracking";
  if (normalizedPath.includes("recomendaciones-ia")) return "recommendations";
  if (normalizedPath.includes("reportes")) return "reports";

  return null;
}

function studentModuleFromMenuItem(
  item: AuthMenuItem | null,
): StudentModuleKey | null {
  const label = normalizeText(menuItemLabel(item));

  if (label.includes("curso")) return "courses";
  if (label.includes("asistencia")) return "attendance";
  if (label.includes("calificacion")) return "grades";
  if (label.includes("participacion")) return "participation";
  if (label.includes("seguimiento")) return "tracking";

  return null;
}

function studentModuleFromPath(path: string): StudentModuleKey | null {
  const normalizedPath = normalizeText(path);

  if (normalizedPath.includes("mis-cursos")) return "courses";
  if (normalizedPath.includes("asistencia")) return "attendance";
  if (normalizedPath.includes("calificacion")) return "grades";
  if (normalizedPath.includes("participacion")) return "participation";
  if (normalizedPath.includes("seguimiento")) return "tracking";

  return null;
}

function guardianModuleFromMenuItem(
  item: AuthMenuItem | null,
): GuardianModuleKey | null {
  const label = normalizeText(menuItemLabel(item));
  if (label.includes("estudiante") || label.includes("hijo")) return "students";
  if (label.includes("asistencia")) return "attendance";
  if (label.includes("calificacion")) return "grades";
  if (label.includes("seguimiento")) return "tracking";
  if (label.includes("notificacion")) return "notifications";
  return null;
}

function guardianModuleFromPath(path: string): GuardianModuleKey | null {
  const normalizedPath = normalizeText(path);
  if (normalizedPath.includes("mis-estudiantes")) return "students";
  if (normalizedPath.includes("asistencia")) return "attendance";
  if (normalizedPath.includes("calificacion")) return "grades";
  if (normalizedPath.includes("seguimiento")) return "tracking";
  if (normalizedPath.includes("notificacion")) return "notifications";
  return null;
}

const COURSE_SCOPED_MENU_LABELS = new Set([
  "asistencia",
  "calificaciones",
  "participaciones",
  "observaciones",
  "seguimiento estudiantil",
]);

const STUDENT_COURSE_SCOPED_MENU_LABELS = new Set([
  "mi asistencia",
  "asistencia",
  "mis calificaciones",
  "calificaciones",
  "mi participacion",
  "participacion",
]);

const GUARDIAN_STUDENT_SCOPED_MENU_LABELS = new Set([
  "asistencia",
  "calificaciones",
  "seguimiento",
  "seguimiento estudiantil",
]);

function teacherSidebarMenu(items: AuthMenuItem[]): AuthMenuItem[] {
  return items.flatMap((item) => {
    if (COURSE_SCOPED_MENU_LABELS.has(normalizeText(menuItemLabel(item)))) {
      return [];
    }

    const children: AuthMenuItem[] = teacherSidebarMenu(
      item.children ?? item.items ?? [],
    );
    return [{ ...item, children, items: undefined }];
  });
}

function findTeacherCoursesItem(items: AuthMenuItem[]): AuthMenuItem | null {
  for (const item of items) {
    if (teacherModuleFromMenuItem(item) === "courses") return item;
    const child = findTeacherCoursesItem(item.children ?? item.items ?? []);
    if (child) return child;
  }
  return null;
}

function studentSidebarMenu(items: AuthMenuItem[]): AuthMenuItem[] {
  return items.flatMap((item) => {
    if (
      STUDENT_COURSE_SCOPED_MENU_LABELS.has(normalizeText(menuItemLabel(item)))
    ) {
      return [];
    }
    const children: AuthMenuItem[] = studentSidebarMenu(
      item.children ?? item.items ?? [],
    );
    return [{ ...item, children, items: undefined }];
  });
}

function findStudentCoursesItem(items: AuthMenuItem[]): AuthMenuItem | null {
  for (const item of items) {
    if (studentModuleFromMenuItem(item) === "courses") return item;
    const child = findStudentCoursesItem(item.children ?? item.items ?? []);
    if (child) return child;
  }
  return null;
}

function studentCourseSectionFromSlug(
  slug: string | undefined,
): StudentCourseSection {
  const sections: Record<string, StudentCourseSection> = {
    asistencia: "attendance",
    calificaciones: "grades",
    participacion: "participation",
    resumen: "overview",
    seguimiento: "tracking",
  };
  return sections[slug ?? ""] ?? "overview";
}

function studentCourseModuleSlug(module?: StudentModuleKey) {
  const slugs: Partial<Record<StudentModuleKey, string>> = {
    attendance: "asistencia",
    grades: "calificaciones",
    participation: "participacion",
    tracking: "seguimiento",
  };
  return module ? slugs[module] ?? "resumen" : "resumen";
}

function guardianSidebarMenu(items: AuthMenuItem[]): AuthMenuItem[] {
  return items.flatMap((item) => {
    if (
      GUARDIAN_STUDENT_SCOPED_MENU_LABELS.has(normalizeText(menuItemLabel(item)))
    ) {
      return [];
    }
    const children: AuthMenuItem[] = guardianSidebarMenu(
      item.children ?? item.items ?? [],
    );
    return [{ ...item, children, items: undefined }];
  });
}

function findGuardianStudentsItem(items: AuthMenuItem[]): AuthMenuItem | null {
  for (const item of items) {
    if (guardianModuleFromMenuItem(item) === "students") return item;
    const child = findGuardianStudentsItem(item.children ?? item.items ?? []);
    if (child) return child;
  }
  return null;
}

function guardianCourseSectionFromSlug(
  slug: string | undefined,
): GuardianCourseSection {
  const sections: Record<string, GuardianCourseSection> = {
    asistencia: "attendance",
    calificaciones: "grades",
    resumen: "overview",
    seguimiento: "tracking",
  };
  return sections[slug ?? ""] ?? "overview";
}

function guardianModuleSlug(module?: GuardianModuleKey) {
  const slugs: Partial<Record<GuardianModuleKey, string>> = {
    attendance: "asistencia",
    grades: "calificaciones",
    tracking: "seguimiento",
  };
  return module ? slugs[module] ?? "resumen" : "resumen";
}

function courseSectionFromSlug(slug: string | undefined): TeacherCourseSection {
  const sections: Record<string, TeacherCourseSection> = {
    asistencia: "attendance",
    calificaciones: "grades",
    estudiantes: "students",
    observaciones: "observations",
    participaciones: "participations",
    "recomendaciones-ia": "recommendations",
    reportes: "reports",
    resumen: "overview",
    seguimiento: "tracking",
  };

  return sections[slug ?? ""] ?? "overview";
}

function courseModuleSlug(module?: TeacherModuleKey) {
  const slugs: Partial<Record<TeacherModuleKey, string>> = {
    attendance: "asistencia",
    grades: "calificaciones",
    observations: "observaciones",
    participations: "participaciones",
    recommendations: "recomendaciones-ia",
    reports: "reportes",
    tracking: "seguimiento",
  };

  return module ? slugs[module] ?? "resumen" : "resumen";
}

function AccessDeniedPage() {
  return (
    <section className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center shadow-theme-xs">
      <h2 className="text-2xl font-bold text-red-700">
        No tienes permiso para acceder a este recurso
      </h2>
      <p className="mt-2 text-sm text-red-700">
        Contacta al administrador si necesitas habilitar esta opcion.
      </p>
    </section>
  );
}

function ModulePlaceholderPage({ path }: { path: string }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center shadow-theme-xs">
      <h2 className="text-2xl font-bold text-gray-900">Modulo disponible</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-gray-500">
        El backend habilito esta opcion para tu rol. Falta conectar la pantalla
        React correspondiente para la ruta {path}.
      </p>
    </section>
  );
}

function GuardianCourseSelectionPage({
  onNavigate,
  studentsPath,
}: {
  onNavigate: (path: string) => void;
  studentsPath: string;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center shadow-theme-xs">
      <h2 className="text-xl font-bold text-gray-900">
        Selecciona primero un curso
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        La informacion academica se consulta desde el curso de cada estudiante.
      </p>
      <button
        className="mt-5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        onClick={() => onNavigate(studentsPath)}
        type="button"
      >
        Ir a mis estudiantes
      </button>
    </section>
  );
}

export function AdminLayout({ currentPath, onNavigate }: AdminLayoutProps) {
  const { accessToken, dashboard, logout, menuItems, primaryRole, user } =
    useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isTeacher = normalizeText(primaryRole ?? "") === "docente";
  const normalizedRole = normalizeText(primaryRole ?? "");
  const isStudent = normalizedRole === "estudiante" || normalizedRole === "alumno";
  const isGuardian =
    normalizedRole.includes("apoderado") ||
    normalizedRole.includes("padre") ||
    normalizedRole.includes("madre");
  const visibleMenuItems = useMemo(
    () =>
      isTeacher
        ? teacherSidebarMenu(menuItems)
        : isStudent
          ? studentSidebarMenu(menuItems)
          : isGuardian
            ? guardianSidebarMenu(menuItems)
            : menuItems,
    [isGuardian, isStudent, isTeacher, menuItems],
  );
  const coursesPath =
    menuItemPath(findTeacherCoursesItem(menuItems) ?? {}) ?? "/docente/mis-cursos";
  const studentCoursesPath =
    menuItemPath(findStudentCoursesItem(menuItems) ?? {}) ??
    "/estudiante/mis-cursos";
  const guardianStudentsPath =
    menuItemPath(findGuardianStudentsItem(menuItems) ?? {}) ??
    "/apoderado/mis-estudiantes";

  const handleNavigate = (path: string) => {
    if (!path || path === "#") return;

    onNavigate(normalizeAdminPath(path));
    setIsSidebarOpen(false);
  };

  const renderContent = () => {
    if (!accessToken || !user) return null;
    const path = normalizePath(currentPath);
    const activeMenuItem = findMenuItem(menuItems, path);
    const courseRoute = path.match(
      /^\/docente\/mis-cursos\/(\d+)(?:\/([^/]+))?$/,
    );
    const studentCourseRoute = path.match(
      /^\/estudiante\/mis-cursos\/(\d+)(?:\/([^/]+))?$/,
    );
    const guardianStudentRoute = path.match(
      /^\/apoderado\/mis-estudiantes\/(\d+)(?:\/([^/]+))?$/,
    );
    const guardianCourseRoute = path.match(
      /^\/apoderado\/mis-estudiantes\/(\d+)\/cursos\/(\d+)(?:\/([^/]+))?$/,
    );

    if (path === "/403") {
      return <AccessDeniedPage />;
    }

    if (isTeacher && courseRoute) {
      return (
        <TeacherCourseWorkspacePage
          courseId={Number(courseRoute[1])}
          coursesPath={coursesPath}
          initialSection={courseSectionFromSlug(courseRoute[2])}
          onNavigate={handleNavigate}
          token={accessToken}
        />
      );
    }

    if (isStudent && studentCourseRoute) {
      return (
        <StudentCourseWorkspacePage
          courseId={Number(studentCourseRoute[1])}
          coursesPath={studentCoursesPath}
          initialSection={studentCourseSectionFromSlug(studentCourseRoute[2])}
          onNavigate={handleNavigate}
        />
      );
    }

    if (isGuardian && guardianCourseRoute) {
      return (
        <GuardianPageErrorBoundary resetKey={path}>
          <GuardianCourseWorkspacePage
            courseId={Number(guardianCourseRoute[2])}
            initialSection={guardianCourseSectionFromSlug(
              guardianCourseRoute[3],
            )}
            onNavigate={handleNavigate}
            studentId={Number(guardianCourseRoute[1])}
          />
        </GuardianPageErrorBoundary>
      );
    }

    if (isGuardian && guardianStudentRoute) {
      return (
        <GuardianPageErrorBoundary resetKey={path}>
          <GuardianStudentWorkspacePage
            onNavigate={handleNavigate}
            studentId={Number(guardianStudentRoute[1])}
            studentsPath={guardianStudentsPath}
          />
        </GuardianPageErrorBoundary>
      );
    }

    if (path === "/admin/gestion-academica/anios") {
      return <AcademicYearsPage token={accessToken} />;
    }

    if (path === "/admin/gestion-academica/periodos") {
      return <AcademicPeriodsPage token={accessToken} />;
    }

    if (path === "/admin/gestion-academica/grados-secciones") {
      return <AcademicGradesSectionsPage token={accessToken} />;
    }

    if (path === "/admin/gestion-academica/cursos") {
      return <AcademicCoursesPage token={accessToken} />;
    }

    if (path === "/admin/gestion-academica/asignaciones") {
      return <CourseAssignmentsPage token={accessToken} />;
    }

    if (path === "/admin/usuarios/estudiantes") {
      return <StudentsPage token={accessToken} />;
    }

    if (path === "/admin/usuarios/docentes") {
      return <TeachersPage token={accessToken} />;
    }

    if (path === "/admin/usuarios/apoderados") {
      return <GuardiansPage token={accessToken} />;
    }

    if (path === "/admin/usuarios/roles") {
      return <UserRolesPage token={accessToken} />;
    }

    if (path === "/admin/matriculas") {
      return <EnrollmentsPage token={accessToken} />;
    }

    if (path === "/admin/seguimiento/incidencias") {
      return <IncidentsPage token={accessToken} />;
    }

    if (path === "/admin/seguimiento/observaciones") {
      return <ObservationsPage token={accessToken} />;
    }

    if (path === "/admin/seguimiento/recomendaciones-ia") {
      return <AIRecommendationsPage token={accessToken} />;
    }

    if (path === "/admin/reportes") {
      return <ReportsPage token={accessToken} />;
    }

    if (path === "/admin/auditoria") {
      return <AuditPage token={accessToken} />;
    }

    if (path === "/admin/configuracion") {
      return <SettingsPage token={accessToken} />;
    }

    if (
      path === "/admin" ||
      path === "/dashboard" ||
      isDashboardItem(activeMenuItem)
    ) {
      return (
        <AdminDashboardPage
          dashboard={dashboard}
          primaryRole={primaryRole}
          user={user}
        />
      );
    }

    const studentModule =
      studentModuleFromMenuItem(activeMenuItem) ?? studentModuleFromPath(path);

    if (isStudent && studentModule) {
      return (
        <StudentModulePage
          module={studentModule}
          onOpenCourse={
            studentModule === "courses"
              ? (courseId, module) =>
                  handleNavigate(
                    `/estudiante/mis-cursos/${courseId}/${studentCourseModuleSlug(module)}`,
                  )
              : undefined
          }
        />
      );
    }

    const guardianModule =
      guardianModuleFromMenuItem(activeMenuItem) ??
      guardianModuleFromPath(path);

    if (
      isGuardian &&
      (guardianModule === "attendance" ||
        guardianModule === "grades" ||
        guardianModule === "tracking")
    ) {
      return (
        <GuardianCourseSelectionPage
          onNavigate={handleNavigate}
          studentsPath={guardianStudentsPath}
        />
      );
    }

    if (isGuardian && guardianModule) {
      return (
        <GuardianPageErrorBoundary resetKey={path}>
          <GuardianModulePage
            module={guardianModule}
            onOpenStudent={
              guardianModule === "students"
                ? (studentId, module) =>
                    handleNavigate(
                      `/apoderado/mis-estudiantes/${studentId}/${guardianModuleSlug(module)}`,
                    )
                : undefined
            }
          />
        </GuardianPageErrorBoundary>
      );
    }

    const teacherModule =
      teacherModuleFromMenuItem(activeMenuItem) ?? teacherModuleFromPath(path);

    if (isTeacher && teacherModule) {
      return (
        <TeacherModulePage
          module={teacherModule}
          onOpenCourse={
            teacherModule === "courses"
              ? (courseId, module) =>
                  handleNavigate(
                    `/docente/mis-cursos/${courseId}/${courseModuleSlug(module)}`,
                  )
              : undefined
          }
          token={accessToken}
        />
      );
    }

    return <ModulePlaceholderPage path={currentPath} />;
  };

  if (!accessToken || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {isSidebarOpen && (
        <button
          aria-label="Cerrar menú"
          className="fixed inset-0 z-20 bg-gray-950/40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          type="button"
        />
      )}

      <AdminSidebar
        currentPath={currentPath}
        isOpen={isSidebarOpen}
        menuItems={visibleMenuItems}
        onNavigate={handleNavigate}
      />

      <div className="lg:pl-[290px]">
        <AdminHeader
          onLogout={logout}
          onToggleSidebar={() => setIsSidebarOpen(true)}
          primaryRole={primaryRole}
          user={user}
        />
        <main className="mx-auto max-w-7xl p-4 sm:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
