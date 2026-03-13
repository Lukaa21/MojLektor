export type ServiceType = "LEKTURA" | "KOREKTURA" | "BOTH";
export type Language = "crnogorski" | "srpski" | "hrvatski" | "bosanski";

export type ProcessRequest = {
  rawText: string;
  serviceType: ServiceType;
  textType: string;
  language: Language;
};

export type DiffOp =
  | { type: "unchanged"; value: string }
  | { type: "deleted"; value: string }
  | { type: "added"; value: string }
  | { type: "modified"; original: string; edited: string };

export type ReversibleChange = {
  id: string;
  original: string;
  modified: string;
  startIndex: number;
  endIndex: number;
  groupKey: string;
  status: "active" | "reverted";
};

export type ReversibleToken = {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  changeId?: string;
  groupKey?: string;
  status: "static" | "active" | "reverted";
};

export type ProcessResponse = {
  original: string;
  edited: string;
  diff: DiffOp[];
  changes: ReversibleChange[];
  tokens: ReversibleToken[];
  cardCount: number;
  remainingBalance?: number;
  status: "DONE";
};

export type EstimateRequest = {
  rawText: string;
  serviceType: ServiceType;
  textType: string;
  language: Language;
};

export type TokenPackage = {
  id: string;
  tokenAmount: number;
  priceEur: number;
};

export type EstimateResponse = {
  rawText?: string;
  requiredTokens: number;
  currentBalance: number;
  canProcess: boolean;
  suggestedPackage: TokenPackage | null;
  recommendedPackagePrice?: number | null;
  nextLowerPackage: TokenPackage | null;
  differenceToLowerPackage: number | null;
};

export type TokenPackagesResponse = {
  packages: TokenPackage[];
};

export type TokenBalanceResponse = {
  userId: string;
  balance: number;
};

export type CheckoutResponse = {
  checkoutUrl: string;
};

export type AuthUser = {
  id: string;
  email: string;
  tokenBalance: number;
};

export type AuthResponse = {
  user: AuthUser;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
};

const normalizePath = (path: string) => (path.startsWith("/") ? path : `/${path}`);

export const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(normalizePath(path), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMessage = "Neuspjesan zahtjev.";
    let errorCode: string | undefined;
    let details: Record<string, unknown> | undefined;

    try {
      const payload = (await response.json()) as
        | { error?: string | { code?: string; message?: string } }
        | Record<string, unknown>;

      if (typeof payload === "object" && payload !== null) {
        details = payload as Record<string, unknown>;
      }

      if (
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload
      ) {
        const errPayload = payload.error;
        if (typeof errPayload === "string") {
          errorMessage = errPayload;
        } else if (typeof errPayload === "object" && errPayload !== null) {
          const messageValue =
            "message" in errPayload ? errPayload.message : undefined;
          const codeValue = "code" in errPayload ? errPayload.code : undefined;

          if (typeof messageValue === "string") {
            errorMessage = messageValue;
          }

          if (typeof codeValue === "string") {
            errorCode = codeValue;
          }
        }
      }
    } catch {
      // Ignore JSON parse errors for non-JSON responses.
    }

    throw new ApiError(errorMessage, response.status, errorCode, details);
  }

  return (await response.json()) as T;
};
