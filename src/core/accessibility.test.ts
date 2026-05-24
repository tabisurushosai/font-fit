import { describe, expect, it } from 'vitest';

import { getAccessibleThemeColors } from './accessibility';
import { BACKGROUND_COLORS, type BackgroundColor } from './settings';

const AA_NORMAL_TEXT_RATIO = 4.5;
const MIN_FOCUS_INDICATOR_RATIO = 3;

function relativeLuminance(hexColor: string): number {
  const channels = hexColor
    .replace('#', '')
    .match(/.{2}/g)
    ?.map((channel) => parseInt(channel, 16) / 255);

  if (!channels || channels.length !== 3) {
    throw new Error(`Invalid hex color: ${hexColor}`);
  }

  const linearChannels = channels.map((channel) => (
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));

  const [red, green, blue] = linearChannels as [number, number, number];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(firstColor: string, secondColor: string): number {
  const firstLuminance = relativeLuminance(firstColor);
  const secondLuminance = relativeLuminance(secondColor);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

describe('getAccessibleThemeColors', () => {
  it.each([
    BACKGROUND_COLORS.WHITE,
    BACKGROUND_COLORS.CREAM,
    BACKGROUND_COLORS.DARK
  ] satisfies BackgroundColor[])('keeps text and links WCAG AA against %s', (backgroundColor) => {
    const colors = getAccessibleThemeColors(backgroundColor);

    expect(contrastRatio(colors.text, backgroundColor)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT_RATIO);
    expect(contrastRatio(colors.link, backgroundColor)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT_RATIO);
    expect(contrastRatio(colors.focusRing, backgroundColor)).toBeGreaterThanOrEqual(MIN_FOCUS_INDICATOR_RATIO);
  });
});
