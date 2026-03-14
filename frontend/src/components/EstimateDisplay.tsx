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
        <div
          style={{
            marginTop: 12,
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid #f0c040",
            background: "#fefbe8",
            fontSize: 14,
            color: "#8a6d00",
          }}
        >
          <p>
            Predloženi paket: {suggestedPackage.tokenAmount} tokena za {formatPrice(suggestedPackage.priceEur)}.
          </p>
          {nextLowerPackage && differenceToLowerPackage && differenceToLowerPackage > 0 && (
            <p style={{ marginTop: 4 }}>
              Ako uklonite još {differenceToLowerPackage} karakter/a, možete uzeti paket od {nextLowerPackage.tokenAmount} tokena.
            </p>
          )}
        </div>
      )}
      {hintMessage && (
        <p
          style={{
            marginTop: 12,
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-subtle)",
            color: "var(--text-muted)",
            fontSize: 14,
          }}
        >
          {hintMessage}
        </p>
      )}
    </section>
  );
};
