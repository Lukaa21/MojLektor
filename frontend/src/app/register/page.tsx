"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ApiError } from "../../lib/api";
import { registerUser } from "../../lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== passwordConfirmation) {
      setError("Lozinke se ne poklapaju.");
      return;
    }

    setIsSubmitting(true);

    try {
      await registerUser({ email, password, passwordConfirmation });
      router.push("/");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Registracija nije uspjela.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>Registracija</h2>
      <p style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center", marginBottom: 24 }}>
        Kreirajte nalog i upravljajte tokenima po korisniku.
      </p>

      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Lozinka</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Potvrda lozinke</label>
          <input
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
          />
        </div>

        {error && (
          <p
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--error-bg)",
              color: "var(--error)",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: "100%" }}>
          {isSubmitting ? "Registracija..." : "Kreiraj nalog"}
        </button>
      </form>

      <p style={{ marginTop: 20, fontSize: 14, color: "var(--text-muted)", textAlign: "center" }}>
        Već imate nalog?{" "}
        <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
          Prijava
        </Link>
      </p>
    </div>
  );
}
