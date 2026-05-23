import { describe, expect, it } from 'vitest';

import { formatFixedDecimal, formatInteger, fractionDigitsForStep } from './format';

describe('formatInteger', () => {
  it('formats whole numbers with the supplied locale', () => {
    expect(formatInteger(1234, 'en-US')).toBe('1,234');
  });
});

describe('formatFixedDecimal', () => {
  it('keeps the requested number of fraction digits', () => {
    expect(formatFixedDecimal(1.2, 'en-US', 1)).toBe('1.2');
    expect(formatFixedDecimal(0.05, 'en-US', 2)).toBe('0.05');
  });
});

describe('fractionDigitsForStep', () => {
  it('derives display precision from a slider step', () => {
    expect(fractionDigitsForStep(1)).toBe(0);
    expect(fractionDigitsForStep(0.1)).toBe(1);
    expect(fractionDigitsForStep(0.01)).toBe(2);
  });
});
