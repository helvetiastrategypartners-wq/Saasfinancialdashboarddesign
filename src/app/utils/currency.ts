// Utility for currency formatting - HSP uses CHF (Swiss Francs)

export const CURRENCY = 'CHF';

export function formatCurrency(amount: number, includeDecimals: boolean = true): string {
  const formatted = amount.toLocaleString('fr-CH');
  return includeDecimals 
    ? `${CURRENCY} ${formatted}.00`
    : `${CURRENCY} ${formatted}`;
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 1000) {
    return `${CURRENCY} ${(amount / 1000).toFixed(0)}k`;
  }
  return `${CURRENCY} ${amount.toLocaleString('fr-CH')}`;
}
