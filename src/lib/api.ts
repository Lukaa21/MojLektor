export type ServiceType = "LEKTURA" | "KOREKTURA" | "BOTH";
export type Language = "crnogorski" | "srpski" | "hrvatski" | "bosanski";

export type ProcessRequest = {
  rawText: string;
  serviceType: ServiceType;
  textType: string;
  language: Language;
};

export type ProcessResponse = {
  processedText: string;
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
