import { describe, expect, it } from 'vitest';

import { formatCurrency, formatFixedDecimal, formatInteger, fractionDigitsForStep } from './format';

describe('formatInteger', () => {
  it('formats whole numbers with the supplied locale', () => {
    expect(formatInteger(1234, 'en-US')).toBe('1,234');
  });

  it('accepts browser locale identifiers with underscores', () => {
    expect(formatInteger(1234, 'en_US')).toBe('1,234');
  });
});

describe('formatFixedDecimal', () => {
  it('keeps the requested number of fraction digits', () => {
    expect(formatFixedDecimal(1.2, 'en-US', 1)).toBe('1.2');
    expect(formatFixedDecimal(0.05, 'en-US', 2)).toBe('0.05');
  });

  it('accepts normalized Japanese locale identifiers', () => {
    expect(formatFixedDecimal(1234.5, 'ja_JP', 1)).toBe('1,234.5');
  });
});

describe('formatCurrency', () => {
  it('formats whole currency amounts with localized symbols', () => {
    expect(formatCurrency(3, 'USD', 'en-US')).toBe('$3');
    expect(formatCurrency(3, 'USD', 'ja-JP')).toBe('$3');
  });
});

describe('fractionDigitsForStep', () => {
  it('derives display precision from a slider step', () => {
    expect(fractionDigitsForStep(1)).toBe(0);
    expect(fractionDigitsForStep(0.1)).toBe(1);
    expect(fractionDigitsForStep(0.01)).toBe(2);
  });
});
