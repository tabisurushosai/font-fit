export const FONT_STACKS = {
  UD_GOTHIC: '"BIZ UDPGothic", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif',
  SANS_SERIF: 'sans-serif',
  SERIF: 'serif'
} as const;

export const BACKGROUND_COLORS = {
  WHITE: '#ffffff',
  CREAM: '#fdf5e6',
  DARK: '#333333',
  TRANSPARENT: 'transparent'
} as const;

export const MAX_WIDTHS = {
  NARROW: '640px',
  DEFAULT: '760px',
  FULL: 'none'
} as const;

export type FontFamily = typeof FONT_STACKS[keyof typeof FONT_STACKS];
export type BackgroundColor = typeof BACKGROUND_COLORS[keyof typeof BACKGROUND_COLORS];
export type MaxWidth = typeof MAX_WIDTHS[keyof typeof MAX_WIDTHS];

export interface Settings {
  fontFamily: FontFamily;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  backgroundColor: BackgroundColor;
  maxWidth: MaxWidth;
}

export type Preset = {
  name: string;
  settings: Settings;
};

export type PremiumStatus = {
  isPremium: boolean;
  isTrialing: boolean;
  daysLeft: number;
  trialEndsAt: number;
  trialExpired: boolean;
};

export type PremiumState = {
  isPremium: boolean;
  trialStartTs?: number;
};

export const defaultSettings: Settings = {
  fontFamily: FONT_STACKS.UD_GOTHIC,
  fontSize: 1.2,
  lineHeight: 1.8,
  letterSpacing: 0.05,
  backgroundColor: BACKGROUND_COLORS.WHITE,
  maxWidth: MAX_WIDTHS.DEFAULT
};

export const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function mergeSettings(settings?: Partial<Settings>): Settings {
  return { ...defaultSettings, ...settings };
}

export function shouldShowInitialOnboardingGuide(
  settings: Settings,
  presets: readonly Preset[],
  autoApplySites: readonly string[]
): boolean {
  return (
    presets.length === 0 &&
    autoApplySites.length === 0 &&
    settings.fontFamily === defaultSettings.fontFamily &&
    settings.fontSize === defaultSettings.fontSize &&
    settings.lineHeight === defaultSettings.lineHeight &&
    settings.letterSpacing === defaultSettings.letterSpacing &&
    settings.backgroundColor === defaultSettings.backgroundColor &&
    settings.maxWidth === defaultSettings.maxWidth
  );
}

export function getPremiumStatus(state: PremiumState, now = Date.now()): PremiumStatus {
  const trialStartTs = state.trialStartTs ?? now;
  const trialExpiresAt = trialStartTs + TRIAL_DURATION_MS;
  const isTrialing = now < trialExpiresAt;
  const isPremium = state.isPremium || isTrialing;
  const daysLeft = Math.ceil((trialExpiresAt - now) / (24 * 60 * 60 * 1000));

  return {
    isPremium,
    isTrialing: isTrialing && !state.isPremium,
    daysLeft: isTrialing ? daysLeft : 0,
    trialEndsAt: trialExpiresAt,
    trialExpired: !isTrialing && !state.isPremium
  };
}
