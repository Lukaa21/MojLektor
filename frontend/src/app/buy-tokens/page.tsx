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

  return (
    <div className="container" style={{ paddingTop: 60, paddingBottom: 80 }}>
      <section style={{ textAlign: "center", marginBottom: 48 }}>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 36,
            fontWeight: 400,
            marginBottom: 12,
          }}
        >
          Kupite tokene
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
          1 token = 1 karakter. Tokeni se dodaju nakon potvrđene Stripe uplate.
        </p>
        {balance !== null && (
          <p
            style={{
              marginTop: 16,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--accent-soft)",
              color: "var(--accent)",
              padding: "6px 16px",
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Trenutni balans: {balance} tokena
          </p>
        )}
        {suggestionText && (
          <p
            style={{
              marginTop: 16,
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid #f0c040",
              background: "#fefbe8",
              fontSize: 14,
              color: "#8a6d00",
            }}
          >
            {suggestionText}
          </p>
        )}
        {paymentStatus === "success" && (
          <p
            style={{
              marginTop: 16,
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--success-bg)",
              color: "var(--success)",
              fontSize: 14,
            }}
          >
            Uplata je primljena. Tokeni će biti upisani čim webhook potvrdi transakciju.
          </p>
        )}
        {paymentStatus === "canceled" && (
          <p
            style={{
              marginTop: 16,
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-subtle)",
              color: "var(--text-muted)",
              fontSize: 14,
            }}
          >
            Kupovina je otkazana.
          </p>
        )}
        {error && (
          <p
            style={{
              marginTop: 16,
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--error-bg)",
              color: "var(--error)",
              fontSize: 14,
            }}
          >
            {error}
          </p>
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
                className={`price-card${isFeatured ? " featured" : ""}`}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {packageLabels[i] ?? `Paket ${i + 1}`}
                </div>
                <div className="price-amount">
                  {pkg.priceEur.toFixed(0)}<span style={{ fontSize: 20 }}>€</span>
                </div>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 15,
                    marginBottom: 24,
                  }}
                >
                  {pkg.tokenAmount.toLocaleString()} tokena
                </p>
                <button
                  type="button"
                  onClick={() => void startCheckout(pkg.id)}
                  disabled={purchasingId !== null}
                  className={isFeatured ? "btn-primary" : "btn-secondary"}
                  style={{ width: "100%" }}
                >
                  {purchasingId === pkg.id ? "Preusmjeravanje..." : "Odaberi"}
                </button>
              </article>
            );
          })}
        </div>
      )}

      <div className="trust-section">
        <div className="trust-item">🔒 Sigurno plaćanje putem Stripe-a</div>
        <div className="trust-item">⚡ Instant aktivacija tokena</div>
        <div className="trust-item">📧 Račun na email</div>
      </div>
    </div>
  );
}
