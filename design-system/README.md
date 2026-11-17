# Desert Ember

Black-and-orange design system for Aapka Tourism. All values live in
[`tokens.css`](./tokens.css); this file is the rules for using them.

## Setup

- `tokens.css` is loaded globally from `src/app/layout.tsx`, but every token is
  scoped to the `.desert-ember` class. Put `className='desert-ember'` on the
  root element of any page or section built with this system. Outside it, the
  tokens do not apply. The font, DM Sans, is loaded site-wide by next/font in
  `src/app/layout.tsx` and used for headings and body text on every public page.
- Why scoped: `--card`, `--border`, `--muted` and `--font-sans` already mean
  something else globally (shadcn HSL values, next/font's DM Sans). Never
  move these tokens to `:root`.
- Tailwind classes map to the tokens: `bg-brand`, `hover:bg-brand-hover`,
  `bg-brand-tint`, `text-on-brand`, `bg-black`, `bg-charcoal`, `bg-graphite`,
  `text-ash`, `bg-surface`, `bg-card`, `border-border`, `text-ink`,
  `text-muted`, `text-deal`, `text-success`, `bg-whatsapp`, `rounded-sm`,
  `rounded-lg`, `rounded-full`, `p-1 / p-2 / p-4 / p-6 / p-12 / p-24` (and
  every other spacing utility), `font-sans`, `shadow-glow`,
  `bg-brand-gradient`, and the type scale `text-display`, `text-h1`, `text-h2`,
  `text-h3`, `text-body-lg`, `text-body`, `text-label`, `text-caption`.
  `card`, `muted`, `border`, `black`, `font-sans` and the radii only switch to
  Desert Ember values inside `.desert-ember`.
- In plain CSS, use `var(--token)`. Never write a hex value, font name or pixel
  radius directly.

## Type scale (DM Sans)

| Token     | Size / line | Weight |
| --------- | ----------- | ------ |
| display   | 64 / 68     | 900    |
| h1        | 48 / 54     | 900    |
| h2        | 36 / 42     | 700    |
| h3        | 24 / 30     | 700    |
| body-lg   | 18 / 28     | 500    |
| body      | 16 / 24     | 500    |
| label     | 14 / 20     | 700    |
| caption   | 12 / 16     | 500    |

## Rules

- **Black and orange brand.** Alternate black sections (hero, header, footer,
  one video section) with light sections (`--surface`, `--card`).
- **Orange is about 10% of a page.** `--brand` is for buttons, prices, active
  chips and one highlighted headline word. Nothing else.
- **Buttons are pills** (`--radius-full`) on `--brand` with a 1px `--brand-edge`
  border and **white text** (`--on-brand`)
  on orange. Text that sits on orange but is not a button (banner copy,
  badges on `--brand-glow`) uses `--black`.
- **`--brand-deep`** is the brand taken very dark (like Tripadvisor's dark green).
  List pages (/holidays) use it for headings, body text, outline-pill borders
  and the selected pill, instead of black.
- **Cards and image tiles use `--radius-lg`.** Image cards get a dark bottom
  gradient so white text on them stays readable.
- **Signature gradient** — `--brand` to `--brand-glow` at 135deg
  (`--gradient-brand`) — **once per screen.** `--shadow-glow` also **once per
  screen.**
- **`--deal` only for % off and countdowns. `--whatsapp` only for the WhatsApp
  button.**
- **Mobile first**, generous whitespace, horizontal swipe rows on mobile.
