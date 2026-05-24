import { describe, expect, it } from 'vitest';

import { FONT_STACKS, getPremiumStatus } from './core/settings';

describe('FONT_STACKS', () => {
  it('defines all selectable font stack values', () => {
    expect(FONT_STACKS).toEqual({
      UD_GOTHIC: '"BIZ UDPGothic", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif',
      SANS_SERIF: 'sans-serif',
      SERIF: 'serif'
    });
  });
});

describe('getPremiumStatus', () => {
  it('keeps trial calculations independent from chrome APIs', () => {
    const trialStartTs = 1_000;
    const now = trialStartTs + 2 * 24 * 60 * 60 * 1000;

    expect(getPremiumStatus({ isPremium: false, trialStartTs }, now)).toEqual({
      isPremium: true,
      isTrialing: true,
      daysLeft: 5,
      trialEndsAt: trialStartTs + 7 * 24 * 60 * 60 * 1000,
      trialExpired: false
    });
  });
});
