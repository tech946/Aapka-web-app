import type { CSSProperties, ReactNode } from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/PlusJakartaSans';

/* Shared look of the search clips — Remotion's illustration style (white
   ground, chunky black outlines, a solid offset "slab" shadow) in Desert
   Ember colours. The values mirror design-system/tokens.css: these are
   rendered pixels, so the CSS variables can't reach them. */

export const C = {
  brand: '#FF6A1A',
  brandHover: '#E5550A',
  brandTint: '#FFF2E8',
  black: '#0A0A0B',
  ink: '#111114',
  muted: '#3A3A42',
  ash: '#A1A1AA',
  border: '#E7E7EC',
  surface: '#FAFAF7',
  card: '#FFFFFF',
  success: '#16A34A',
};

export const { fontFamily } = loadFont('normal', { weights: ['600', '800'], subsets: ['latin'] });

export const FPS = 30;
export const DURATION = 135; // 4.5s, loops on the site
export const SIZE = { width: 480, height: 360 };

/** a spring that starts at `from` (frames) */
export function useSpringAt(from: number, damping = 14) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - from, fps, config: { damping, mass: 0.7 } });
}

/** fades and lifts the whole scene in at the start and out at the end, so the clip loops cleanly */
export function Scene({ children }: { children: ReactNode }) {
  const frame = useCurrentFrame();
  const inP = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const outP = interpolate(frame, [DURATION - 12, DURATION - 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const p = Math.min(inP, outP);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: C.card,
        fontFamily,
        color: C.ink,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, opacity: p, transform: `translateY(${(1 - p) * 14}px) scale(${0.96 + p * 0.04})` }}>{children}</div>
    </div>
  );
}

/** an outlined box with the solid offset shadow */
export function Slab({ style, children, depth = 7 }: { style?: CSSProperties; children?: ReactNode; depth?: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        boxSizing: 'border-box',
        border: `3px solid ${C.black}`,
        borderRadius: 18,
        background: C.card,
        boxShadow: `0 ${depth}px 0 ${C.black}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
