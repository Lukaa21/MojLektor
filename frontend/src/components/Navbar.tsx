"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, logoutUser } from "../lib/auth";
import type { AuthUser, TokenBalanceResponse } from "../lib/api";
import { useTokenBalance } from "../context/TokenBalanceContext";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Test", href: "/test" },
];

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const { balance, setBalance } = useTokenBalance();

  useEffect(() => {
    const run = async () => {
      try {
        const me = await getCurrentUser();
        setUser(me);

        if (!me) {
          setBalance(null);
          return;
        }

        const response = await fetch("/api/tokens/balance", {
          credentials: "include",
        });
        if (response.ok) {
          const payload = (await response.json()) as TokenBalanceResponse;
          setBalance(payload.balance);
          return;
        }

        setBalance(me.tokenBalance);
      } catch {
        setUser(null);
        setBalance(null);
      }
    };

    void run();
  }, [pathname]);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setBalance(null);
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.12em] text-slate-900 uppercase"
        >
          MojLektor
        </Link>

        <ul className="flex flex-wrap items-center gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {link.name}
                </Link>
              </li>
            );
          })}

          {user ? (
            <>
              <li>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-700">
                  Tokeni: {balance ?? user.tokenBalance}
                </span>
              </li>
              <li>
                <Link
                  href="/buy-tokens"
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                    pathname === "/buy-tokens"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  Buy Tokens
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  href="/login"
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                    pathname === "/login"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                    pathname === "/register"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
