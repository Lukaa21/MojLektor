"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  postJson,
  type CheckoutResponse,
  type TokenBalanceResponse,
  type TokenPackage,
  type TokenPackagesResponse,
} from "../../lib/api";
import { getCurrentUser } from "../../lib/auth";

export default function BuyTokensPage() {
  const router = useRouter();
  const [requiredTokens, setRequiredTokens] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<"success" | "canceled" | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push("/login?next=/buy-tokens");
          return;
        }

        const params = new URLSearchParams(window.location.search);
        const required = Number(params.get("requiredTokens") || 0);
        setRequiredTokens(Number.isFinite(required) ? required : 0);

        if (params.get("success") === "1") {
          setPaymentStatus("success");
        } else if (params.get("canceled") === "1") {
          setPaymentStatus("canceled");
        }

        const [pkgRes, balanceRes] = await Promise.all([
          fetch("/api/tokens/packages", { credentials: "include" }),
          fetch("/api/tokens/balance", { credentials: "include" }),
        ]);

        if (pkgRes.status === 401 || balanceRes.status === 401) {
          router.push("/login?next=/buy-tokens");
          return;
        }

        if (!pkgRes.ok || !balanceRes.ok) {
          throw new Error("Neuspjelo učitavanje token podataka.");
        }

        const pkgData = (await pkgRes.json()) as TokenPackagesResponse;
        const balanceData = (await balanceRes.json()) as TokenBalanceResponse;

        setPackages(pkgData.packages || []);
        setBalance(balanceData.balance);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Greška pri učitavanju.";
        setError(message);
      } finally {
        setIsAuthChecking(false);
        setIsLoading(false);
      }
    };

    void run();
  }, [router]);

  const suggestionText = useMemo(() => {
    if (!requiredTokens || requiredTokens <= 0) {
      return null;
    }

    const matching = [...packages]
      .sort((a, b) => a.tokenAmount - b.tokenAmount)
      .find((pkg) => pkg.tokenAmount >= requiredTokens);

    if (!matching) {
      return `Za ${requiredTokens} karaktera potreban je veći paket od trenutno ponuđenih.`;
    }

    return `Za obradu od ${requiredTokens} karaktera preporuka je paket ${matching.tokenAmount} tokena.`;
  }, [packages, requiredTokens]);

  const startCheckout = async (packageId: string) => {
    setPurchasingId(packageId);
    setError(null);

    try {
      const data = await postJson<CheckoutResponse>("/api/tokens/checkout", {
        packageId,
      });

      if (!data.checkoutUrl) {
        throw new Error("Checkout link nije dostupan.");
      }

      window.location.href = data.checkoutUrl;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login?next=/buy-tokens");
        return;
      }

      const message =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Neuspjela kupovina tokena.";
      setError(message);
      setPurchasingId(null);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="container" style={{ paddingTop: 80, textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Provjera prijave...</p>
      </div>
    );
  }

  const packageLabels = ["Osnovni", "Popularno", "Pro"];
  const packageDescriptions = [
    "Idealan za kraće eseje i poslovne mailove.",
    "Za studente i profesionalne pisce.",
    "Najbolja cijena za duge rukopise i knjige.",
  ];

  return (
    <div className="container" style={{ paddingTop: 60, paddingBottom: 80 }}>
      <section className="intro-section">
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 42,
            fontWeight: 400,
            marginBottom: 16,
          }}
        >
          Jednostavna dopuna.
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          Bez pretplate, bez obaveza. Koristite tokene kada su vam potrebni.
        </p>

        {suggestionText && (
          <div className="alert alert-warning">
            <svg className="alert-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            <span>{suggestionText}</span>
          </div>
        )}
        {paymentStatus === "success" && (
          <div className="alert alert-success">
            <svg className="alert-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            <span>Uplata je primljena. Tokeni će biti upisani čim webhook potvrdi transakciju.</span>
          </div>
        )}
        {paymentStatus === "canceled" && (
          <div className="alert alert-info">
            <svg className="alert-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
            <span>Kupovina je otkazana.</span>
          </div>
        )}
        {error && (
          <div className="alert alert-error">
            <svg className="alert-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            <span>{error}</span>
          </div>
        )}
      </section>

      {isLoading ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
          Učitavanje paketa...
        </p>
      ) : packages.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
          Paketi trenutno nijesu dostupni.
        </p>
      ) : (
        <div className="pricing-grid">
          {packages.map((pkg, i) => {
            const isFeatured = i === 1;
            return (
              <article
                key={pkg.id}
                className="price-card"
                style={isFeatured ? { borderColor: "var(--accent)", boxShadow: "var(--shadow-md)" } : undefined}
              >
                <div className="selector-label">
                  {packageLabels[i] ?? `Paket ${i + 1}`}
                </div>
                <div className="price-amount">
                  €{pkg.priceEur.toFixed(0)}
                </div>
                <div className="selector-label" style={{ color: "var(--accent)" }}>
                  {pkg.tokenAmount.toLocaleString("de-DE")} TOKENA
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--text-muted)",
                    margin: "20px 0",
                  }}
                >
                  {packageDescriptions[i] ?? ""}
                </p>
                <button
                  type="button"
                  onClick={() => void startCheckout(pkg.id)}
                  disabled={purchasingId !== null}
                  className={isFeatured ? "btn-primary" : "btn-secondary"}
                  style={{ width: "100%" }}
                >
                  {purchasingId === pkg.id ? "Preusmjeravanje..." : "Kupi paket"}
                </button>
              </article>
            );
          })}
        </div>
      )}

      <div className="trust-section">
        <div className="trust-item">● Tokeni nikad ne ističu</div>
        <div className="trust-item">● Stripe sigurno plaćanje</div>
        <div className="trust-item">● Bez automatske obnove</div>
      </div>
    </div>
  );
}
