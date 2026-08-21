export type GuardianRelationship = "PADRE" | "MADRE" | "TUTOR" | "OTRO";

export type GuardianStudentLink = {
  id: number;
  apoderado: number;
  apoderado_label: string;
  estudiante: number;
  estudiante_label: string;
  parentesco: GuardianRelationship;
  es_principal: boolean;
};

export type GuardianStudentLinkPayload = {
  apoderado: number;
  estudiante: number;
  parentesco: GuardianRelationship;
  es_principal: boolean;
};

export type PaginatedGuardianStudentLinkResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: GuardianStudentLink[];
};

export const guardianRelationshipOptions: Array<{
  label: string;
  value: GuardianRelationship;
}> = [
  {
    label: "Padre",
    value: "PADRE",
  },
  {
    label: "Madre",
    value: "MADRE",
  },
  {
    label: "Tutor",
    value: "TUTOR",
  },
  {
    label: "Otro",
    value: "OTRO",
  },
];
