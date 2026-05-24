function resolveNumberLocale(locale: string): string | undefined {
  const normalizedLocale = locale.trim().replace(/_/g, '-');
  if (!normalizedLocale) return undefined;

  try {
    return Intl.NumberFormat.supportedLocalesOf([normalizedLocale])[0];
  } catch {
    return undefined;
  }
}

export function formatInteger(value: number, locale: string): string {
  return new Intl.NumberFormat(resolveNumberLocale(locale), {
    maximumFractionDigits: 0
  }).format(value);
}

export function formatFixedDecimal(value: number, locale: string, fractionDigits: number): string {
  const safeFractionDigits = Math.max(0, Math.min(20, fractionDigits));

  return new Intl.NumberFormat(resolveNumberLocale(locale), {
    minimumFractionDigits: safeFractionDigits,
    maximumFractionDigits: safeFractionDigits
  }).format(value);
}

export function formatCurrency(value: number, currency: string, locale: string): string {
  const fractionDigits = Number.isInteger(value) ? 0 : 2;

  return new Intl.NumberFormat(resolveNumberLocale(locale), {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
}

export function formatShortDate(value: Date | number, locale: string): string {
  return new Intl.DateTimeFormat(resolveNumberLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(value);
}

export function fractionDigitsForStep(step: number): number {
  const stepText = step.toString();
  if (!stepText.includes('.')) return 0;

  return stepText.split('.')[1]?.replace(/0+$/, '').length ?? 0;
}
