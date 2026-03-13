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
    <div className="min-h-screen bg-[color:var(--background)]">
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 py-10 sm:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Registracija</h1>
          <p className="mt-2 text-sm text-slate-600">Kreirajte nalog i upravljajte tokenima po korisniku.</p>

          <form className="mt-5 flex flex-col gap-4" onSubmit={onSubmit}>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Lozinka
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Potvrda lozinke
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2"
                required
              />
            </label>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? "Registracija..." : "Kreiraj nalog"}
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-600">
            Već imate nalog? <Link href="/login" className="font-semibold text-slate-900">Prijava</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
