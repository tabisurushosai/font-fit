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

export function fractionDigitsForStep(step: number): number {
  const stepText = step.toString();
  if (!stepText.includes('.')) return 0;

  return stepText.split('.')[1]?.replace(/0+$/, '').length ?? 0;
}
