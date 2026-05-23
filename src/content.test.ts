import { describe, expect, it } from 'vitest';

import { FONT_STACKS } from './content';

describe('FONT_STACKS', () => {
  it('defines all selectable font stack values', () => {
    expect(FONT_STACKS).toEqual({
      UD_GOTHIC: '"BIZ UDPGothic", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif',
      SANS_SERIF: 'sans-serif',
      SERIF: 'serif'
    });
  });
});
