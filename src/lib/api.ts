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
  status: "DONE";
};

export type EstimateRequest = {
  rawText: string;
  serviceType: ServiceType;
  textType: string;
  language: Language;
};

export type EstimateResponse = {
  rawText?: string;
  cardCount: number;
  priceBreakdown: {
    serviceType: ServiceType;
    perCard: number;
    cardCount: number;
    subtotal: number;
  };
  totalPrice: number;
};

const normalizePath = (path: string) => (path.startsWith("/") ? path : `/${path}`);

export const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(normalizePath(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMessage = "Neuspjesan zahtjev.";
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) {
        errorMessage = payload.error;
      }
    } catch {
      // Ignore JSON parse errors for non-JSON responses.
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
};
