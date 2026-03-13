import { ServiceType } from "./models";

/**
 * LEKTURA or KOREKTURA: 2 characters = 1 token (odd counts round in user's favor).
 * BOTH: 1 character = 1 token.
 */
export const calculateTokenCost = (
  charCount: number,
  serviceType: ServiceType
): number => {
  if (serviceType === ServiceType.BOTH) {
    return charCount;
  }
  return Math.ceil(charCount / 2);
};
