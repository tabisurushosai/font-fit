import { BACKGROUND_COLORS, type BackgroundColor } from './settings';

export type AccessibleThemeColors = Readonly<{
  text: string;
  link: string;
  focusRing: string;
}>;

const LIGHT_THEME_COLORS: AccessibleThemeColors = {
  text: '#1f2933',
  link: '#005ea8',
  focusRing: '#5b21b6'
};

const DARK_THEME_COLORS: AccessibleThemeColors = {
  text: '#f8fafc',
  link: '#8bd3ff',
  focusRing: '#facc15'
};

export function getAccessibleThemeColors(backgroundColor: BackgroundColor): AccessibleThemeColors {
  return backgroundColor === BACKGROUND_COLORS.DARK ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;
}
