"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, logoutUser } from "../lib/auth";
import type { AuthUser, TokenBalanceResponse } from "../lib/api";
import { useTokenBalance } from "../context/TokenBalanceContext";

const navLinks = [
  { name: "Početna", href: "/" },
  { name: "Test", href: "/test" },
  { name: "Kupi tokene", href: "/buy-tokens" },
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
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(253,252,251,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-light)",
        height: 72,
      }}
    >
      <nav
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "100%",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 24,
            fontWeight: 500,
            color: "var(--accent)",
            textDecoration: "none",
          }}
        >
          MojLektor
        </Link>

        {/* Center nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: isActive ? "var(--text-main)" : "var(--text-muted)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                aria-current={isActive ? "page" : undefined}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {user ? (
            <>
              <div
                className="token-badge"
                style={{
                  textDecoration: "none",
                  color: "var(--accent)",
                  padding: "6px 12px",
                  borderRadius: 99,
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {balance ?? user.tokenBalance} TOKENS
              </div>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--text-muted)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "color 0.2s",
                }}
              >
                Odjavi se
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
              >
                Prijava
              </Link>
              <Link
                href="/register"
                className="btn-primary"
                style={{ padding: "8px 20px", fontSize: 13 }}
              >
                Registracija
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
