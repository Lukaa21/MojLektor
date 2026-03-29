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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    <>
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
                  <span className="token-text-desktop">{balance ?? user.tokenBalance} TOKEN/A</span>
                  <span className="token-count-mobile">{balance ?? user.tokenBalance}</span>
                  <img src="/tokens.png" alt="Tokens" className="token-icon-mobile" />
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="navbar-logout-btn navbar-logout-btn-desktop"
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
            
            {/* Burger menu button */}
            <button
              type="button"
              className={`navbar-burger-btn${mobileMenuOpen ? " active" : ""}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile drawer menu - outside header */}
      {mobileMenuOpen && (
        <>
          <div 
            className="navbar-mobile-overlay"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="navbar-mobile-drawer">
          <div className="navbar-mobile-content">
            <div className="navbar-mobile-links">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`navbar-mobile-link${isActive ? " active" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {!user && (
              <div className="navbar-mobile-auth">
                <Link
                  href="/login"
                  className="navbar-mobile-link navbar-mobile-login"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Prijava
                </Link>
                <Link
                  href="/register"
                  className="navbar-mobile-link navbar-mobile-register"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Registracija
                </Link>
              </div>
            )}

            {user && (
              <div className="navbar-mobile-logout">
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="navbar-mobile-logout-btn"
                >
                  Odjavi se
                </button>
              </div>
            )}
          </div>
        </div>
        </>
      )}
    </>
  );
};

export default Navbar;
