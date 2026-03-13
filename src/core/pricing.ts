import { ServiceType } from "./models";

export const SERVICE_PRICES: Record<ServiceType, number> = {
  [ServiceType.LEKTURA]: 1.0,
  [ServiceType.KOREKTURA]: 0.5,
  [ServiceType.BOTH]: 1.5,
};

export const calculatePrice = (serviceType: ServiceType, cardCount: number) => {
  const perCard = SERVICE_PRICES[serviceType];
  const subtotal = Number((perCard * cardCount).toFixed(2));
  return {
    perCard,
    cardCount,
    subtotal,
    total: subtotal,
  };
};
