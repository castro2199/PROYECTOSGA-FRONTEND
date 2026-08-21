import { useState } from "react";
import type { AuthSession } from "../features/auth/types/auth.types";
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

type AdminLayoutProps = {
  onLogout: () => void;
  session: AuthSession;
};

export function AdminLayout({ onLogout, session }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState("/admin");

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    setIsSidebarOpen(false);
  };

  const renderContent = () => {
    if (currentPath === "/admin/gestion-academica/anios") {
      return <AcademicYearsPage token={session.token} />;
    }

    if (currentPath === "/admin/gestion-academica/periodos") {
      return <AcademicPeriodsPage token={session.token} />;
    }

    if (currentPath === "/admin/gestion-academica/grados-secciones") {
      return <AcademicGradesSectionsPage token={session.token} />;
    }

    if (currentPath === "/admin/gestion-academica/cursos") {
      return <AcademicCoursesPage token={session.token} />;
    }

    if (currentPath === "/admin/gestion-academica/asignaciones") {
      return <CourseAssignmentsPage token={session.token} />;
    }

    if (currentPath === "/admin/usuarios/estudiantes") {
      return <StudentsPage token={session.token} />;
    }

    if (currentPath === "/admin/usuarios/docentes") {
      return <TeachersPage token={session.token} />;
    }

    if (currentPath === "/admin/usuarios/apoderados") {
      return <GuardiansPage token={session.token} />;
    }

    return <AdminDashboardPage user={session.user} />;
  };

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
        onNavigate={handleNavigate}
        user={session.user}
      />

      <div className="lg:pl-[290px]">
        <AdminHeader
          onLogout={onLogout}
          onToggleSidebar={() => setIsSidebarOpen(true)}
          user={session.user}
        />
        <main className="mx-auto max-w-7xl p-4 sm:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
