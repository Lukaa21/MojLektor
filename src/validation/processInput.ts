import { Language, ServiceType } from "../core/models";

export const ALLOWED_LANGUAGES: Language[] = [
  "crnogorski",
  "srpski",
  "hrvatski",
  "bosanski",
];

export const ALLOWED_TEXT_TYPES: string[] = [
  "akademski rad",
  "clanak",
  "knjiga",
  "zvanicni dokument",
];

export const validateProcessInput = (
  serviceType: unknown,
  language: unknown,
  textType?: unknown,
): { ok: true } | { ok: false; error: string } => {
  if (!Object.values(ServiceType).includes(serviceType as ServiceType)) {
    return { ok: false, error: "Invalid serviceType" };
  }
  if (!ALLOWED_LANGUAGES.includes(language as Language)) {
    return { ok: false, error: "Invalid language" };
  }
  if (textType !== undefined && !ALLOWED_TEXT_TYPES.includes(textType as string)) {
    return { ok: false, error: "Invalid textType" };
  }
  return { ok: true };
};
