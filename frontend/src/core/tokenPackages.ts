export type TokenPackage = {
  id: "pkg_3000" | "pkg_7000" | "pkg_15000";
  tokenAmount: number;
  priceEur: number;
  stripePriceId?: string;
};

export const TOKEN_PACKAGES: TokenPackage[] = [
  {
    id: "pkg_3000",
    tokenAmount: 3000,
    priceEur: 5,
    stripePriceId: process.env.STRIPE_PRICE_ID_3000,
  },
  {
    id: "pkg_7000",
    tokenAmount: 7000,
    priceEur: 9,
    stripePriceId: process.env.STRIPE_PRICE_ID_7000,
  },
  {
    id: "pkg_15000",
    tokenAmount: 15000,
    priceEur: 14,
    stripePriceId: process.env.STRIPE_PRICE_ID_15000,
  },
];

export const getRequiredPackage = (requiredTokens: number) =>
  TOKEN_PACKAGES.find((pkg) => pkg.tokenAmount >= requiredTokens) ||
  TOKEN_PACKAGES[TOKEN_PACKAGES.length - 1];

export const getNextLowerPackage = (requiredTokens: number) => {
  const lower = TOKEN_PACKAGES.filter((pkg) => pkg.tokenAmount < requiredTokens);
  if (!lower.length) {
    return null;
  }
  return lower[lower.length - 1];
};

export const getTokenPackageSuggestion = (requiredTokens: number) => {
  const requiredPackage = getRequiredPackage(requiredTokens);
  const nextLowerPackage = getNextLowerPackage(requiredTokens);

  return {
    requiredPackage,
    nextLowerPackage,
    differenceToLowerPackage: nextLowerPackage
      ? requiredTokens - nextLowerPackage.tokenAmount
      : null,
  };
};
