"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, logoutUser } from "../lib/auth";
import type { AuthUser, TokenBalanceResponse } from "../lib/api";
import { useTokenBalance } from "../context/TokenBalanceContext";
import "./Navbar.css";

const navLinks = [
  { name: "Početna", href: "/" },
  { name: "Demo", href: "/test" },
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
    router.push("/test");
    router.refresh();
  };

  return (
    <header className="navbar-header">
      <nav className="navbar-container">
        {/* Logo */}
        <Link
          href="/"
          
        >
          <img
            src="/mojlektor_logo.png"
            alt="MojLektor logo"
            width={160}
            height={160}
            className="navbar-logo"
          />
        </Link>

        {/* Center nav links */}
        <div className="navbar-nav-links">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`navbar-nav-link${isActive ? " active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="navbar-right">
          {user ? (
            <>
              <div
                className="token-badge navbar-token-badge"
              >
                {balance ?? user.tokenBalance} TOKEN/A
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="navbar-logout-btn"
              >
                Odjavi se
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="navbar-login-link"
              >
                Prijava
              </Link>
              <Link
                href="/register"
                className="btn-primary navbar-register-link"
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
