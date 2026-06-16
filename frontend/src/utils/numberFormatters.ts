/**
 * Utility functions for formatting numbers and currencies professionally.
 */

interface FormatOptions {
  decimals?: number;
  compact?: boolean;
}

/**
 * Formats a number with optional decimal control and compact notation (K, M, B).
 */
export const formatNumber = (value: number | string | undefined | null, options: FormatOptions = {}): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  const { decimals = 2, compact = false } = options;

  if (compact) {
    return Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: decimals,
    }).format(num);
  }

  return Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Formats a number as currency.
 */
export const formatCurrency = (value: number | string | undefined | null, options: FormatOptions = {}): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (num === null || num === undefined || isNaN(num)) {
    return '$0';
  }

  const { decimals = 2, compact = false } = options;

  if (compact) {
    const formatted = formatNumber(num, { decimals, compact });
    return `$${formatted}`;
  }

  return Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Formats a number as a percentage.
 */
export const formatPercent = (value: number | string | undefined | null, decimals: number = 1): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (num === null || num === undefined || isNaN(num)) {
    return '0%';
  }

  return `${num.toFixed(decimals)}%`;
};

/**
 * Short utility for very compact numbers often used in charts or small cards.
 */
export const formatCompact = (value: number | string | undefined | null): string => {
  return formatNumber(value, { compact: true, decimals: 1 });
};
