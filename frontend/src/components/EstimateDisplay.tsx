import type { ServiceType } from "../core/models";

type EstimateDisplayProps = {
  requiredTokens: number;
  currentBalance: number;
  canProcess: boolean;
  suggestedPackage?: {
    tokenAmount: number;
    priceEur: number;
  } | null;
  nextLowerPackage?: {
    tokenAmount: number;
    priceEur: number;
  } | null;
  differenceToLowerPackage?: number | null;
  hintMessage?: string | null;
  serviceType?: ServiceType;
};

const formatPrice = (value: number) => `${value.toFixed(2)} EUR`;

const serviceLabel: Record<string, string> = {
  LEKTURA: "Lektura",
  KOREKTURA: "Korektura",
  BOTH: "Lektura + Korektura",
};

export const EstimateDisplay = ({
  requiredTokens,
  currentBalance,
  canProcess,
  suggestedPackage,
  nextLowerPackage,
  differenceToLowerPackage,
  hintMessage,
  serviceType,
}: EstimateDisplayProps) => {
  return (
    <section className="estimate-card" style={{ marginBottom: 32 }}>
      <h4>Procjena troškova</h4>
      {serviceType && (
        <div className="est-row">
          <span className="est-label">Model obrade</span>
          <span className="est-value">{serviceLabel[serviceType] ?? serviceType}</span>
        </div>
      )}
      <div className="est-row">
        <span className="est-label">Potrebno tokena</span>
        <span className="est-value">{requiredTokens}</span>
      </div>
      <div className="est-row">
        <span className="est-label">Trenutni balans</span>
        <span className="est-value">{currentBalance}</span>
      </div>
      {canProcess && (
        <div className="est-row">
          <span className="est-label">Nakon obrade ostaće vam</span>
          <span className="est-value">{currentBalance - requiredTokens} token/a</span>
        </div>
      )}
      <div className="est-row" style={{ borderTop: "1px solid var(--border-light)", paddingTop: 12, marginTop: 8 }}>
        <span className="est-label">Status</span>
        <span className={`status-badge ${canProcess ? "success" : "error"}`}>
          {canProcess ? "Dovoljno tokena" : "Nedovoljno tokena"}
        </span>
      </div>
      {!canProcess && suggestedPackage && (
        <div className="alert alert-warning" style={{ marginTop: 12 }}>
          <svg className="alert-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          <div>
            <p>
              Predloženi paket: {suggestedPackage.tokenAmount} tokena za {formatPrice(suggestedPackage.priceEur)}.
            </p>
            {nextLowerPackage && differenceToLowerPackage && differenceToLowerPackage > 0 && (
              <p style={{ marginTop: 4 }}>
                Ako uklonite još {differenceToLowerPackage} karakter/a, možete uzeti paket od {nextLowerPackage.tokenAmount} tokena.
              </p>
            )}
          </div>
        </div>
      )}
      {hintMessage && (
        <div className="alert alert-info" style={{ marginTop: 12 }}>
          <svg className="alert-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
          <span>{hintMessage}</span>
        </div>
      )}
    </section>
  );
};
