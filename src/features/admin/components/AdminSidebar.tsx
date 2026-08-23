import { useMemo, useState } from "react";
import type { AuthMenuItem } from "../../auth/types/auth.types";
import { normalizeAdminPath } from "../utils/adminRoutes";

type AdminSidebarProps = {
  currentPath: string;
  isOpen: boolean;
  menuItems: AuthMenuItem[];
  onNavigate: (path: string) => void;
};

function getItemLabel(item: AuthMenuItem) {
  return item.label ?? item.title ?? item.name ?? "Sin titulo";
}

function getItemPath(item: AuthMenuItem) {
  const path = item.path ?? item.route ?? item.url ?? item.href ?? "#";

  if (path === "#" || /^https?:\/\//i.test(path)) return path;
  return normalizeAdminPath(path);
}

function getChildren(item: AuthMenuItem) {
  return item.children ?? item.items ?? [];
}

function getItemKey(item: AuthMenuItem) {
  return String(item.id ?? item.key ?? getItemPath(item) ?? getItemLabel(item));
}

function isActivePath(currentPath: string, item: AuthMenuItem) {
  const itemPath = getItemPath(item);
  const normalizedCurrentPath = normalizeAdminPath(currentPath);
  const normalizedItemPath = itemPath.replace(/\/+$/, "") || "/";

  if (normalizedCurrentPath === normalizedItemPath) return true;
  if (
    normalizedItemPath !== "/admin" &&
    normalizedCurrentPath.startsWith(`${normalizedItemPath}/`)
  ) {
    return true;
  }
  if (
    normalizedItemPath.endsWith("/mis-cursos") &&
    normalizedCurrentPath.includes("/mis-cursos/")
  ) {
    return true;
  }
  if (
    normalizedItemPath.endsWith("/mis-estudiantes") &&
    normalizedCurrentPath.includes("/mis-estudiantes/")
  ) {
    return true;
  }
  return getChildren(item).some(
    (child) =>
      normalizedCurrentPath === (getItemPath(child).replace(/\/+$/, "") || "/"),
  );
}

function MenuIcon({ item }: { item: AuthMenuItem }) {
  const label = getItemLabel(item);

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">
      {item.icon ? <img alt="" className="h-5 w-5" src={item.icon} /> : label.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function AdminSidebar({
  currentPath,
  isOpen,
  menuItems,
  onNavigate,
}: AdminSidebarProps) {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const normalizedMenu = useMemo(() => menuItems, [menuItems]);

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
            I.E. Libertadores de America
          </p>
          <p className="text-xs font-medium text-gray-500">Cusco</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Menu por rol
        </p>

        {normalizedMenu.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
            No hay opciones disponibles para tu rol.
          </div>
        ) : (
          <ul className="space-y-1">
            {normalizedMenu.map((item) => {
              const active = isActivePath(currentPath, item);
              const label = getItemLabel(item);
              const children = getChildren(item);
              const expanded = openMenus[label] ?? active;
              const path = getItemPath(item);

              return (
                <li key={getItemKey(item)}>
                  <button
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-brand-50 text-brand-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    onClick={() =>
                      children.length > 0 ? toggleMenu(label) : onNavigate(path)
                    }
                    type="button"
                  >
                    <MenuIcon item={item} />
                    <span className="flex-1">{label}</span>
                    {children.length > 0 && (
                      <span
                        className={`text-xs transition-transform ${
                          expanded ? "rotate-90" : ""
                        }`}
                      >
                        &gt;
                      </span>
                    )}
                  </button>

                  {children.length > 0 && expanded && (
                    <ul className="ml-12 mt-1 space-y-1">
                      {children.map((child) => {
                        const childPath = getItemPath(child);

                        return (
                          <li key={getItemKey(child)}>
                            <button
                              className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                                normalizeAdminPath(currentPath) ===
                                (childPath.replace(/\/+$/, "") || "/")
                                  ? "bg-brand-50 text-brand-600"
                                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                              }`}
                              onClick={() => onNavigate(childPath)}
                              type="button"
                            >
                              {getItemLabel(child)}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}
