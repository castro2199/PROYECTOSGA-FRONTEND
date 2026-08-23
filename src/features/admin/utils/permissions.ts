import type { AuthUser } from "../../auth/types/auth.types";
import { adminMenu } from "../config/adminMenu";
import type { AdminMenuItem, AdminPermission } from "../types/admin.types";

const allAdminPermissions = new Set<AdminPermission>();

function collectPermissions(items: AdminMenuItem[]) {
  items.forEach((item) => {
    allAdminPermissions.add(item.permission);
    if (item.children) {
      collectPermissions(item.children);
    }
  });
}

collectPermissions(adminMenu);

const groupPermissions: Record<string, AdminPermission[]> = {
  administrador: Array.from(allAdminPermissions),
  admin: Array.from(allAdminPermissions),
  directivo: Array.from(allAdminPermissions),
  docente: [
    "dashboard.view",
    "tracking.view",
    "tracking.incidents.view",
    "tracking.observations.view",
    "reports.view",
  ],
};

const groupAliases: Record<string, string> = {
  administradores: "administrador",
  directivos: "directivo",
  profesor: "docente",
  profesores: "docente",
  teacher: "docente",
  teachers: "docente",
  docente: "docente",
  docentes: "docente",
};

function normalizeGroup(group: string) {
  const normalized = group.trim().toLowerCase();
  return groupAliases[normalized] ?? normalized;
}

export function getUserPermissions(user: AuthUser) {
  if (user.is_superuser || user.is_staff) {
    return allAdminPermissions;
  }

  const permissions = new Set<AdminPermission>();

  user.groups.map(normalizeGroup).forEach((group) => {
    groupPermissions[group]?.forEach((permission) => {
      permissions.add(permission);
    });
  });

  if (user.docente_id) {
    groupPermissions.docente.forEach((permission) => {
      permissions.add(permission);
    });
  }

  return permissions;
}

export function filterMenuByPermissions(
  items: AdminMenuItem[],
  permissions: Set<AdminPermission>,
): AdminMenuItem[] {
  return items
    .filter((item) => permissions.has(item.permission))
    .map((item) => ({
      ...item,
      children: item.children
        ? filterMenuByPermissions(item.children, permissions)
        : undefined,
    }));
}
