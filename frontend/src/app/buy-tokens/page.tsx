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
      <div className="min-h-screen bg-[color:var(--background)]">
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10 sm:px-8 lg:px-12">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-slate-600">
            Provjera prijave...
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10 sm:px-8 lg:px-12">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Kupi tokene</h1>
          <p className="mt-2 text-sm text-slate-600">
            1 token = 1 karakter. Tokeni se dodaju nakon potvrđene Stripe uplate.
          </p>
          {balance !== null ? (
            <p className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              Trenutni balans: {balance} tokena
            </p>
          ) : null}
          {suggestionText ? (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {suggestionText}
            </p>
          ) : null}
          {paymentStatus === "success" ? (
            <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Uplata je primljena. Tokeni će biti upisani čim webhook potvrdi transakciju.
            </p>
          ) : null}
          {paymentStatus === "canceled" ? (
            <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Kupovina je otkazana.
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
              Učitavanje paketa...
            </div>
          ) : null}

          {!isLoading && packages.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
              Paketi trenutno nijesu dostupni.
            </div>
          ) : null}

          {packages.map((pkg) => (
            <article
              key={pkg.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{pkg.tokenAmount} tokena</h2>
                <p className="mt-1 text-sm text-slate-600">{pkg.priceEur.toFixed(2)} EUR</p>
              </div>
              <button
                type="button"
                onClick={() => void startCheckout(pkg.id)}
                disabled={purchasingId !== null}
                className="mt-auto w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {purchasingId === pkg.id ? "Preusmjeravanje..." : "Kupi paket"}
              </button>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
