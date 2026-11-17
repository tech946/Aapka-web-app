import { interpolate, useCurrentFrame } from 'remotion';
import { C, Scene, Slab, useSpringAt } from './theme';

/* Offer packages: a holiday ticket; the old price gets struck through, the
   offer price springs in in orange, and a "-35%" badge pops on the corner. */

export function Offer() {
  const frame = useCurrentFrame();
  const ticket = useSpringAt(0);
  const strike = interpolate(frame, [28, 42], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const price = useSpringAt(46, 10);
  const badge = useSpringAt(64, 9);
  const plane = interpolate(frame, [0, 134], [-6, 6]);

  return (
    <Scene>
      <Slab
        style={{
          left: 48,
          top: 78,
          width: 384,
          height: 200,
          transform: `translateY(${(1 - ticket) * 30}px) rotate(${(1 - ticket) * 3 - 2}deg)`,
        }}
      >
        {/* price side */}
        <div style={{ position: 'absolute', left: 26, top: 22, width: 240 }}>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 1.5, color: C.muted }}>DUBAI · 4N / 5D</div>
          <div style={{ position: 'relative', display: 'inline-block', marginTop: 14, fontSize: 30, fontWeight: 800, color: C.ash }}>
            AED 1,480
            <span
              style={{
                position: 'absolute',
                left: -4,
                top: '52%',
                height: 6,
                width: `calc(${strike * 100}% + 8px)`,
                borderRadius: 3,
                background: C.brand,
                border: `2px solid ${C.black}`,
                transform: 'translateY(-50%) rotate(-3deg)',
                transformOrigin: 'left center',
              }}
            />
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 50,
              fontWeight: 800,
              lineHeight: 1.05,
              color: C.brand,
              transform: `scale(${price})`,
              transformOrigin: 'left center',
              WebkitTextStroke: `1.5px ${C.black}`,
            }}
          >
            AED 950
          </div>
        </div>

        {/* stub: dashed tear line + plane */}
        <div style={{ position: 'absolute', left: 282, top: 14, bottom: 14, borderLeft: `3px dashed ${C.black}` }} />
        <svg
          width="56"
          height="56"
          viewBox="0 0 24 24"
          style={{ position: 'absolute', left: 304, top: 72, transform: `translateY(${plane}px) rotate(-30deg)` }}
        >
          <path
            d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"
            fill={C.brand}
            stroke={C.black}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      </Slab>

      {/* -35% badge */}
      <div
        style={{
          position: 'absolute',
          left: 340,
          top: 26,
          width: 104,
          height: 104,
          borderRadius: 52,
          boxSizing: 'border-box',
          display: 'grid',
          placeItems: 'center',
          background: C.brand,
          border: `3px solid ${C.black}`,
          boxShadow: `0 6px 0 ${C.black}`,
          color: C.card,
          fontSize: 30,
          fontWeight: 800,
          transform: `scale(${badge}) rotate(${(1 - badge) * -60 + 10}deg)`,
        }}
      >
        -35%
      </div>
    </Scene>
  );
}
