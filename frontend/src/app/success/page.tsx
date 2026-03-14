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
    <div
      className="container"
      style={{
        paddingTop: 100,
        paddingBottom: 80,
        textAlign: "center",
        maxWidth: 500,
      }}
    >
      {state === "success" && (
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--success-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: 28,
            color: "var(--success)",
          }}
        >
          ✓
        </div>
      )}
      <h2
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 32,
          fontWeight: 400,
          marginBottom: 12,
        }}
      >
        Status plaćanja
      </h2>
      <p style={{ color: "var(--text-muted)", fontSize: 15, marginBottom: 32 }}>
        {message}
      </p>

      {state === "success" && (
        <Link href="/buy-tokens?success=1" className="btn-primary">
          Nazad na tokene
        </Link>
      )}

      {(state === "open" || state === "error") && (
        <Link href="/buy-tokens" className="btn-secondary">
          Povratak
        </Link>
      )}
    </div>
  );
}
