"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { loginUser } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nextPath, setNextPath] = useState("/");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get("next") || "/");
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await loginUser({ email, password });
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Prijava nije uspjela.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>Prijava</h2>
      <p style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center", marginBottom: 24 }}>
        Prijavite se da biste koristili tokene i obradu teksta.
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
          {isSubmitting ? "Prijava..." : "Prijavi se"}
        </button>
      </form>

      <p style={{ marginTop: 20, fontSize: 14, color: "var(--text-muted)", textAlign: "center" }}>
        Nemate nalog?{" "}
        <Link href="/register" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
          Registracija
        </Link>
      </p>
    </div>
  );
}
