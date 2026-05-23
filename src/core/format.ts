export function formatInteger(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0
  }).format(value);
}

export function formatFixedDecimal(value: number, locale: string, fractionDigits: number): string {
  const safeFractionDigits = Math.max(0, Math.min(20, fractionDigits));

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: safeFractionDigits,
    maximumFractionDigits: safeFractionDigits
  }).format(value);
}

export function fractionDigitsForStep(step: number): number {
  const stepText = step.toString();
  if (!stepText.includes('.')) return 0;

  return stepText.split('.')[1]?.replace(/0+$/, '').length ?? 0;
}
