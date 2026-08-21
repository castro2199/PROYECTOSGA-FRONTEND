import type { AuthUser } from "../../auth/types/auth.types";

type AdminHeaderProps = {
  onLogout: () => void;
  onToggleSidebar: () => void;
  user: AuthUser;
};

export function AdminHeader({
  onLogout,
  onToggleSidebar,
  user,
}: AdminHeaderProps) {
  const displayName = user.full_name || user.username;

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
              Panel administrador
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">
              {user.is_superuser ? "Administrador / Directivo" : "Usuario"}
            </p>
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
