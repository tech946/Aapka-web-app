import type { CSSProperties } from 'react';

const LAYOUT = /^(width|minWidth|maxWidth|flex|flexGrow|flexShrink|flexBasis|alignSelf|justifySelf|gridColumn|gridRow|gridArea|order|margin(Top|Right|Bottom|Left|Inline|Block)?)$/;

/** Keeps only the layout part of an inline style (width, flex, margins…).
    Custom dashboard fields draw their own box, so a call site's old
    padding / border / colour for the native control is dropped. */
export function layoutStyle(style?: CSSProperties): CSSProperties | undefined {
  if (!style) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(style)) if (LAYOUT.test(k)) out[k] = v;
  return out as CSSProperties;
}
