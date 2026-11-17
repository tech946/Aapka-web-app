# Backup: dashed-border look, 2026-10-28

Taken just before the new-design (`.fr`) pages moved from dashed black
outlines everywhere to solid hairlines, soft shadows and filled chips. The
logo palette and white background from earlier the same day are already in
these copies (see `backups/palette-green-yellow-2026-10-28` for before that).

## What changed

New tokens in the `.fr` block of `src/app/(marketing)/Home/foreigner/foreigner.css`:

| Token                   | Value / use                                              |
| ----------------------- | -------------------------------------------------------- |
| `--fr-hairline`         | 11% black: card, modal, divider lines                    |
| `--fr-hairline-strong`  | 24% black: fields, outline pills and buttons             |
| `--fr-line-on-dark`     | 28% white: outlines on the black footer / dark sections  |
| `--fr-soft`             | light warm grey: hover background                        |
| `--fr-indigo-soft`      | light indigo: tag chips                                  |
| `--fr-radius`           | 6px → 8px (buttons, fields, chips)                       |
| `--fr-radius-lg`        | 16px (cards, modals; was a literal 12px)                 |
| `--fr-shadow`, `-hover`, `-lg` | card, card hover, modal shadows                   |
| `--fr-ticket`           | the one dashed line kept: price row of package cards     |

By kind:

- Cards (packages, reviews, checkout, contact, partner, plan your trip):
  hairline + soft shadow; package and review cards lift on hover.
- Modals (Filters, booking, document examples, agent popover, menus):
  hairline, 16px corners, large shadow; Filters backdrop slightly blurred.
- Buttons: solid; filled buttons have no visible outline.
- Fields and dropdowns: solid light-grey border, orange border + soft orange
  ring on focus, light grey on hover.
- Pills and chips: light outline, grey hover; selected = filled.
- Badges: package tags, checkout add-ons → light indigo chips;
  "Required" → peach chip.
- Footer: dashed boxes removed; plain columns between two faint lines;
  the "Plan your trip" card is a soft filled panel.
- Header bar: solid, slightly translucent with blur and a soft shadow.
- Kept dashed on purpose: the "ticket" line above the price on package
  cards, the upload drop zones, the road line under the homepage marquee.
- Also: Filters "Apply" is the orange main button (`hl-btn--primary`,
  `HolidaysFilters.tsx`); package-card price is larger; review quote marks
  are orange; selected payment / solo options get an orange border.

## Follow-up, same day: white icons on black

Icons that sat on a black background were orange; they are now white
(`--fr-on-accent`): contact card icons, partner benefit icons, the sign-up
plan icon, icons inside black buttons (checkout Pay, Send, Book, WhatsApp),
the review-slider arrows on hover and the agent launcher's ✕. Footer social
icons now turn white on an orange square on hover. Button text on black is
still orange. These are small additions at the end of the same files, so the
restore below covers them too.

Then: text on black is white too. Every rule with a black background and
orange text (black buttons like View details / Submit / Book now / Pay,
active filter pills, selected chips and calendar days, the active step
number, "Most popular", the featured review avatar) now uses
`--fr-on-accent`, and the package-page token `--on-brand` is white. The
"View holidays" and About-banner hover pills roll to white
(`bottomClass="fr-text-light"` in `FrHero.tsx` and `AboutBanner.tsx`; their
`.bak` copies are here too). Orange headings on black sections stay orange.

## Homepage hero video

The homepage hero (`FrHero.tsx`, `.fr-banner` rules in `foreigner.css`) now
fills the viewport with `/videos/home-hero.mp4` behind a dark shade, with the
Palm Jumeirah photo `/images/package-3.jpg` as poster. It plays
`/videos/home-hero-1080.mp4`, a 1080p / 3 Mbps / 3.6 MB copy of the 4K
original made with Windows' built-in Media Foundation encoder (original kept
at `/videos/home-hero.mp4`). Visitors with reduced motion get the poster
only. Title and tagline are white; the
cards and tagline are spaced with a flex `gap` so they can't touch.
`FrHero.tsx` and `content.ts` (`HERO.video`, `HERO.poster`) are backed up
here as `.bak`.

## How to go back

From the project root (Git Bash):

```bash
cd backups/dashed-borders-2026-10-28 && find src -name "*.bak" | while read f; do cp "$f" "../../${f%.bak}"; done
```

Then remove `hl-btn--primary` from the Apply button in
`src/app/(marketing)/holidays/foreigner/HolidaysFilters.tsx` (harmless if
left, it only makes Apply orange).
