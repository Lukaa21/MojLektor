"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type TokenBalanceContextType = {
  balance: number | null;
  setBalance: (balance: number | null) => void;
  refreshBalance: () => Promise<void>;
};

const TokenBalanceContext = createContext<TokenBalanceContextType | null>(null);

export const TokenBalanceProvider = ({ children }: { children: ReactNode }) => {
  const [balance, setBalance] = useState<number | null>(null);

  const refreshBalance = useCallback(async () => {
    try {
      const response = await fetch("/api/tokens/balance", {
        credentials: "include",
      });
      if (response.ok) {
        const payload = (await response.json()) as { balance: number };
        setBalance(payload.balance);
      }
    } catch {
      // silently fail
    }
  }, []);

  return (
    <TokenBalanceContext.Provider value={{ balance, setBalance, refreshBalance }}>
      {children}
    </TokenBalanceContext.Provider>
  );
};

export const useTokenBalance = () => {
  const ctx = useContext(TokenBalanceContext);
  if (!ctx) throw new Error("useTokenBalance must be used within TokenBalanceProvider");
  return ctx;
};
