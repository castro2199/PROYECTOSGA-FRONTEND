import type { AuthUser } from "../../auth/types/auth.types";
import { NotificationBell } from "../../notifications/components/NotificationBell";
import type { SgaNotification } from "../../notifications/types/notification.types";

type AdminHeaderProps = {
  onLogout: () => void;
  onNotificationAction: (notification: SgaNotification) => void;
  onNotifications: () => void;
  onToggleSidebar: () => void;
  primaryRole: string | null;
  user: AuthUser;
};

export function AdminHeader({
  onLogout,
  onNotificationAction,
  onNotifications,
  onToggleSidebar,
  primaryRole,
  user,
}: AdminHeaderProps) {
  const displayName = user.full_name || user.username;
  const roleLabel = primaryRole || user.groups[0] || "Usuario";
  const normalizedRole = roleLabel.toLowerCase();
  const panelTitle = normalizedRole.includes("admin")
    ? "Panel administrativo"
    : normalizedRole.includes("estudiante") || normalizedRole.includes("alumno")
      ? "Portal del estudiante"
      : normalizedRole.includes("apoderado") ||
          normalizedRole.includes("padre") ||
          normalizedRole.includes("madre")
        ? "Portal del apoderado"
      : normalizedRole.includes("docente")
        ? "Portal docente"
        : `Portal ${roleLabel}`;

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            aria-label="Abrir menú"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 lg:hidden"
            onClick={onToggleSidebar}
            type="button"
          >
            ☰
          </button>
          <div>
            <p className="text-sm font-semibold text-gray-500">
              Sistema de Gestión Académica
            </p>
            <h1 className="text-lg font-bold text-gray-900">
              {panelTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell
            onOpenNotification={onNotificationAction}
            onViewAll={onNotifications}
          />
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>
          <button
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-theme-xs transition hover:bg-gray-50"
            onClick={onLogout}
            type="button"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
