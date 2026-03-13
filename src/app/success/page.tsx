"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CheckoutSessionStatus = {
  id: string;
  status: "open" | "complete" | "expired";
  paymentStatus: "paid" | "unpaid" | "no_payment_required";
  customerEmail: string | null;
};

export default function SuccessPage() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "success" | "open" | "error">("loading");
  const [message, setMessage] = useState<string>("Provjeravamo status uplate...");

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");

      if (!sessionId) {
        setState("error");
        setMessage("Nedostaje session_id u povratnom URL-u.");
        return;
      }

      try {
        const response = await fetch(
          `/api/tokens/checkout-session?session_id=${encodeURIComponent(sessionId)}`,
          { credentials: "include" }
        );

        if (response.status === 401) {
          router.push(`/login?next=/success?session_id=${encodeURIComponent(sessionId)}`);
          return;
        }

        if (!response.ok) {
          throw new Error("Neuspjelo čitanje Checkout sesije.");
        }

        const payload = (await response.json()) as CheckoutSessionStatus;

        if (payload.status === "open") {
          setState("open");
          setMessage("Plaćanje još nije završeno. Možete pokušati ponovo.");
          return;
        }

        if (payload.status === "complete" && payload.paymentStatus === "paid") {
          setState("success");
          setMessage(
            payload.customerEmail
              ? `Uplata je potvrđena. Potvrda će stići na ${payload.customerEmail}.`
              : "Uplata je potvrđena."
          );
          return;
        }

        setState("error");
        setMessage("Checkout sesija je zatvorena bez potvrđenog plaćanja.");
      } catch (error) {
        setState("error");
        setMessage(error instanceof Error ? error.message : "Greška prilikom provjere uplate.");
      }
    };

    void run();
  }, [router]);

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-10 sm:px-8 lg:px-12">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Status plaćanja</h1>
          <p className="mt-3 text-sm text-slate-700">{message}</p>

          <div className="mt-5 flex gap-3">
            {state === "success" ? (
              <Link
                href="/buy-tokens?success=1"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Nazad na tokene
              </Link>
            ) : null}

            {state === "open" || state === "error" ? (
              <Link
                href="/buy-tokens"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Povratak
              </Link>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
