/**
 * ZennSMM Currency Configuration and Utilities
 */

export const CURRENCIES = {
  INR: { symbol: '₹', rate: 83.5, label: 'INR' },
  USD: { symbol: '$', rate: 1, label: 'USD' },
  EUR: { symbol: '€', rate: 0.92, label: 'EUR' },
  GBP: { symbol: '£', rate: 0.79, label: 'GBP' },
  AED: { symbol: 'د.إ', rate: 3.67, label: 'AED' },
};

export type CurrencyCode = keyof typeof CURRENCIES;

export const DEFAULT_CURRENCY: CurrencyCode = 'INR';

/**
 * Gets the preferred currency from localStorage or returns the default.
 */
export const getActiveCurrency = (): CurrencyCode => {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY;
  const saved = localStorage.getItem('zennsmm_currency') as CurrencyCode;
  return (saved && CURRENCIES[saved]) ? saved : DEFAULT_CURRENCY;
};

export const formatPrice = (usdAmount: number, code?: CurrencyCode) => {
  const activeCode = code || getActiveCurrency();
  const config = CURRENCIES[activeCode] || CURRENCIES[DEFAULT_CURRENCY];
  const converted = usdAmount * config.rate;
  
  // For AED, add a space after the symbol for readability
  const symbol = activeCode === 'AED' ? `${config.symbol} ` : config.symbol;
  
  return `${symbol}${converted.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
