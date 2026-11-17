import { interpolate, useCurrentFrame } from 'remotion';
import { C, Scene, Slab, useSpringAt } from './theme';

/* Anydate packages: a calendar card; the orange pick hops from date to date
   (any date works), then a "Your date ✓" pill pops under it. */

const COLS = 7;
const CELL = 40;
const GAP = 6;
const GRID_X = 24;
const GRID_Y = 64;
// the dates the pick lands on, as [column, row], and when it gets there
const HOPS: Array<{ at: number; cell: [number, number] }> = [
  { at: 18, cell: [1, 0] },
  { at: 42, cell: [4, 1] },
  { at: 64, cell: [2, 2] },
  { at: 86, cell: [5, 3] },
];

function cellPos([col, row]: [number, number]) {
  return { x: GRID_X + col * (CELL + GAP), y: GRID_Y + row * (CELL + GAP) };
}

export function Anydate() {
  const frame = useCurrentFrame();
  const card = useSpringAt(0);
  const pill = useSpringAt(96, 11);

  // where the pick is: springs from one hop to the next
  let pos = cellPos(HOPS[0].cell);
  for (let i = 1; i < HOPS.length; i++) {
    const prev = cellPos(HOPS[i - 1].cell);
    const next = cellPos(HOPS[i].cell);
    const t = interpolate(frame, [HOPS[i].at - 10, HOPS[i].at], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const e = t * t * (3 - 2 * t);
    if (frame >= HOPS[i].at - 10) pos = { x: prev.x + (next.x - prev.x) * e, y: prev.y + (next.y - prev.y) * e - Math.sin(e * Math.PI) * 16 };
  }
  const pickIn = useSpringAt(HOPS[0].at - 6, 10);
  // the date under the pick: the last hop it has landed on
  const landed = [...HOPS].reverse().find((h) => frame >= h.at) ?? HOPS[0];
  const day = landed.cell[1] * COLS + landed.cell[0] + 1;

  const width = GRID_X * 2 + COLS * CELL + (COLS - 1) * GAP;
  const height = GRID_Y + 4 * CELL + 3 * GAP + 22;

  return (
    <Scene>
      <Slab
        style={{
          left: (480 - width) / 2,
          top: 16,
          width,
          height,
          overflow: 'hidden',
          transform: `translateY(${(1 - card) * 30}px) rotate(${(1 - card) * -3}deg)`,
        }}
      >
        {/* month bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 46,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            background: C.brand,
            borderBottom: `3px solid ${C.black}`,
            color: C.card,
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 1,
          }}
        >
          <span>ANY DATE</span>
          <span style={{ display: 'flex', gap: 8 }}>
            <i style={{ width: 12, height: 12, borderRadius: 6, background: C.card }} />
            <i style={{ width: 12, height: 12, borderRadius: 6, background: C.card, opacity: 0.55 }} />
          </span>
        </div>

        {/* date grid */}
        {Array.from({ length: COLS * 4 }, (_, n) => {
          const col = n % COLS;
          const row = Math.floor(n / COLS);
          const { x, y } = cellPos([col, row]);
          return (
            <div
              key={n}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: CELL,
                height: CELL,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 10,
                background: C.surface,
                border: `2px solid ${C.border}`,
                boxSizing: 'border-box',
                color: C.muted,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              {n + 1}
            </div>
          );
        })}

        {/* the pick */}
        <div
          style={{
            position: 'absolute',
            left: pos.x - 3,
            top: pos.y - 3,
            width: CELL + 6,
            height: CELL + 6,
            borderRadius: 12,
            background: C.brand,
            border: `3px solid ${C.black}`,
            boxSizing: 'border-box',
            boxShadow: `0 4px 0 ${C.black}`,
            transform: `scale(${pickIn})`,
            display: 'grid',
            placeItems: 'center',
            color: C.card,
            fontSize: 17,
            fontWeight: 800,
          }}
        >
          {day}
        </div>
      </Slab>

      {/* "Any date ✓" */}
      <Slab
        depth={5}
        style={{
          left: 480 / 2 - 92,
          top: 298,
          width: 184,
          height: 46,
          borderRadius: 23,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          fontSize: 19,
          fontWeight: 800,
          transform: `scale(${pill})`,
        }}
      >
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            background: C.success,
            color: C.card,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.card} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        Your date
      </Slab>
    </Scene>
  );
}
