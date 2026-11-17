import { interpolate, useCurrentFrame } from 'remotion';
import { C, Scene, Slab, useSpringAt } from './theme';

/* UAE tours: a map card; the Abu Dhabi pin drops, a dashed route draws to
   Dubai with an orange marker riding its tip, the Dubai pin drops, and a
   "Day tour" pill pops in. */

// the route, in the map card's coordinates: a quadratic curve A → B
const A = { x: 96, y: 196 };
const CTRL = { x: 170, y: 40 };
const B = { x: 330, y: 104 };

function at(t: number) {
  const u = 1 - t;
  return {
    x: u * u * A.x + 2 * u * t * CTRL.x + t * t * B.x,
    y: u * u * A.y + 2 * u * t * CTRL.y + t * t * B.y,
  };
}
// curve length, sampled
const LENGTH = (() => {
  let len = 0;
  let prev = at(0);
  for (let i = 1; i <= 100; i++) {
    const p = at(i / 100);
    len += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return len;
})();
const D = `M ${A.x} ${A.y} Q ${CTRL.x} ${CTRL.y} ${B.x} ${B.y}`;

function Pin({ x, y, drop }: { x: number; y: number; drop: number }) {
  return (
    <svg
      width="44"
      height="56"
      viewBox="0 0 44 56"
      style={{ position: 'absolute', left: x - 22, top: y - 54, transform: `translateY(${(1 - drop) * -40}px) scale(${0.4 + drop * 0.6})`, opacity: Math.min(1, drop * 2), transformOrigin: '50% 100%' }}
    >
      <path d="M22 53C22 53 4 33 4 21a18 18 0 0 1 36 0c0 12-18 32-18 32z" fill={C.brand} stroke={C.black} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="22" cy="21" r="7" fill={C.card} stroke={C.black} strokeWidth="3" />
    </svg>
  );
}

function Label({ x, y, text, show }: { x: number; y: number; text: string; show: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        padding: '5px 12px',
        borderRadius: 999,
        border: `2.5px solid ${C.black}`,
        background: C.card,
        fontSize: 15,
        fontWeight: 800,
        whiteSpace: 'nowrap',
        transform: `translateX(-50%) scale(${show})`,
      }}
    >
      {text}
    </div>
  );
}

export function Tours() {
  const frame = useCurrentFrame();
  const map = useSpringAt(0);
  const pinA = useSpringAt(8, 10);
  const route = interpolate(frame, [20, 72], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const eased = route * route * (3 - 2 * route);
  const pinB = useSpringAt(72, 10);
  const pill = useSpringAt(90, 11);
  const tip = at(eased);

  return (
    <Scene>
      <Slab
        style={{
          left: 32,
          top: 26,
          width: 416,
          height: 290,
          overflow: 'hidden',
          background: C.surface,
          transform: `translateY(${(1 - map) * 30}px) rotate(${(1 - map) * -3}deg)`,
        }}
      >
        {/* dotted map ground + a soft coast */}
        <svg width="416" height="290" style={{ position: 'absolute', left: -3, top: -3 }}>
          <defs>
            <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.6" fill={C.border} />
            </pattern>
            <mask id="reveal">
              <path d={D} fill="none" stroke="#fff" strokeWidth="12" strokeDasharray={LENGTH} strokeDashoffset={LENGTH * (1 - eased)} />
            </mask>
          </defs>
          <rect width="416" height="290" fill="url(#dots)" />
          <path d="M0 250 C 90 226, 170 268, 260 236 S 380 214, 416 226 L 416 290 L 0 290 Z" fill={C.brandTint} stroke={C.black} strokeWidth="3" />
          <path d={D} fill="none" stroke={C.black} strokeWidth="4" strokeDasharray="10 9" strokeLinecap="round" mask="url(#reveal)" />
        </svg>

        <Pin x={A.x} y={A.y} drop={pinA} />
        <Pin x={B.x} y={B.y} drop={pinB} />

        {/* marker on the route's tip */}
        {route > 0 && route < 1 ? (
          <div
            style={{
              position: 'absolute',
              left: tip.x - 11,
              top: tip.y - 11,
              width: 22,
              height: 22,
              borderRadius: 11,
              boxSizing: 'border-box',
              background: C.brand,
              border: `3px solid ${C.black}`,
            }}
          />
        ) : null}

        <Label x={A.x} y={A.y + 10} text="Abu Dhabi" show={pinA} />
        <Label x={B.x} y={B.y + 10} text="Dubai" show={pinB} />
      </Slab>

      {/* "Day tour" */}
      <Slab
        depth={5}
        style={{
          left: 480 / 2 - 80,
          top: 296,
          width: 160,
          height: 44,
          borderRadius: 22,
          display: 'grid',
          placeItems: 'center',
          background: C.brand,
          color: C.card,
          fontSize: 18,
          fontWeight: 800,
          transform: `scale(${pill})`,
        }}
      >
        Day tour
      </Slab>
    </Scene>
  );
}
