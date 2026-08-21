import type { ReactNode } from "react";

export type AdminPermission =
  | "dashboard.view"
  | "academic.view"
  | "academic.years.view"
  | "academic.periods.view"
  | "academic.sections.view"
  | "academic.courses.view"
  | "academic.assignments.view"
  | "users.view"
  | "users.students.view"
  | "users.teachers.view"
  | "users.guardians.view"
  | "users.roles.view"
  | "enrollments.view"
  | "tracking.view"
  | "tracking.incidents.view"
  | "tracking.observations.view"
  | "tracking.ai_recommendations.view"
  | "reports.view"
  | "audit.view"
  | "settings.view";

export type AdminMenuItem = {
  label: string;
  path: string;
  icon: ReactNode;
  permission: AdminPermission;
  children?: AdminMenuItem[];
};
