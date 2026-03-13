import { Language, ServiceType } from "../core/models";

export const ALLOWED_LANGUAGES: Language[] = [
  "crnogorski",
  "srpski",
  "hrvatski",
  "bosanski",
];

export const validateProcessInput = (
  serviceType: unknown,
  language: unknown
): { ok: true } | { ok: false; error: string } => {
  if (!Object.values(ServiceType).includes(serviceType as ServiceType)) {
    return { ok: false, error: "Invalid serviceType" };
  }
  if (!ALLOWED_LANGUAGES.includes(language as Language)) {
    return { ok: false, error: "Invalid language" };
  }
  return { ok: true };
};
