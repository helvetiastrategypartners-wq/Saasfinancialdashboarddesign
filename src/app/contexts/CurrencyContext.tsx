import { createContext, useContext, useState } from "react";

export type Currency = 'CHF' | 'EUR' | 'USD';

export const CURRENCY_RATES: Record<Currency, number> = {
  CHF: 1.0,
  EUR: 0.95,
  USD: 1.10,
};

const CONFIG: Record<Currency, { symbol: string; prefix: string; locale: string }> = {
  CHF: { symbol: 'CHF', prefix: 'CHF ', locale: 'fr-CH' },
  EUR: { symbol: '€',   prefix: '€',    locale: 'fr-FR' },
  USD: { symbol: '$',   prefix: '$',    locale: 'en-US' },
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  convert: (chfAmount: number) => number;
  format: (chfAmount: number) => string;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

function fmt(chfAmount: number, currency: Currency): string {
  const converted = chfAmount * CURRENCY_RATES[currency];
  const abs = Math.abs(converted);
  const cfg = CONFIG[currency];
  const sign = converted < 0 ? '-' : '';
  const hasCents = Math.round(abs * 100) % 100 !== 0;
  const opts: Intl.NumberFormatOptions = hasCents
    ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    : { minimumFractionDigits: 0, maximumFractionDigits: 0 };
  return `${sign}${cfg.prefix}${abs.toLocaleString(cfg.locale, opts)}`;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('CHF');

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      convert: (chfAmount) => chfAmount * CURRENCY_RATES[currency],
      format: (chfAmount) => fmt(chfAmount, currency),
      symbol: CONFIG[currency].symbol,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be inside CurrencyProvider");
  return ctx;
}
