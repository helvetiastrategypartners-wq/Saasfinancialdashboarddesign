// Utility for currency formatting - HSP uses CHF (Swiss Francs)

export const CURRENCY = 'CHF';

/**
 * Affiche un montant CHF exact :
 * - pas de décimales si le montant est un nombre entier (ex: CHF 258'700)
 * - 2 décimales sinon (ex: CHF 258'700.50)
 * Jamais d'abréviation "k" — la valeur exacte est toujours affichée.
 */
export function formatCHF(amount: number): string {
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  const opts: Intl.NumberFormatOptions = hasCents
    ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    : { minimumFractionDigits: 0, maximumFractionDigits: 0 };
  return `CHF ${amount.toLocaleString('fr-CH', opts)}`;
}

// Alias conservé pour rétrocompatibilité — même comportement précis
export const formatCurrencyShort = formatCHF;
export const formatCurrency      = formatCHF;
