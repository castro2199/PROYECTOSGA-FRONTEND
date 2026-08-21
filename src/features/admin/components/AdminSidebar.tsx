import { useMemo, useState } from "react";
import type { AuthUser } from "../../auth/types/auth.types";
import { adminMenu } from "../config/adminMenu";
import { filterMenuByPermissions, getUserPermissions } from "../utils/permissions";
import type { AdminMenuItem } from "../types/admin.types";

type AdminSidebarProps = {
  currentPath: string;
  isOpen: boolean;
  onNavigate: (path: string) => void;
};

function isActivePath(currentPath: string, item: AdminMenuItem) {
  if (currentPath === item.path) return true;
  return item.children?.some((child) => currentPath === child.path) ?? false;
}

export function AdminSidebar({
  currentPath,
  isOpen,
  onNavigate,
  user,
}: AdminSidebarProps & { user: AuthUser }) {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    "Gestión académica": true,
    Usuarios: true,
    Seguimiento: true,
  });

  const visibleMenu = useMemo(() => {
    const permissions = getUserPermissions(user);
    return filterMenuByPermissions(adminMenu, permissions);
  }, [user]);

  const toggleMenu = (label: string) => {
    setOpenMenus((current) => ({
      ...current,
      [label]: !current[label],
    }));
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex w-[290px] flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f1d45] text-sm font-bold text-[#f5c400]">
          IE
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">
            I.E. Libertadores de América
          </p>
          <p className="text-xs font-medium text-gray-500">Cusco</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Menú por rol
        </p>

        <ul className="space-y-1">
          {visibleMenu.map((item) => {
            const active = isActivePath(currentPath, item);
            const expanded = openMenus[item.label] ?? active;

            return (
              <li key={item.label}>
                <button
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                    active
                      ? "bg-brand-50 text-brand-600"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() =>
                    item.children ? toggleMenu(item.label) : onNavigate(item.path)
                  }
                  type="button"
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.children && (
                    <span
                      className={`text-xs transition-transform ${
                        expanded ? "rotate-90" : ""
                      }`}
                    >
                      ›
                    </span>
                  )}
                </button>

                {item.children && expanded && (
                  <ul className="ml-12 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <li key={child.label}>
                        <button
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                            currentPath === child.path
                              ? "bg-brand-50 text-brand-600"
                              : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                          }`}
                          onClick={() => onNavigate(child.path)}
                          type="button"
                        >
                          {child.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
