# Backup: green / yellow palette (before the logo palette), 2026-10-28

On 2026-10-28 the new-design pages (the `.fr` theme) moved from the reference
site's green / yellow palette to the Aapka logo palette (orange + indigo,
with black). This folder holds the files exactly as they were before.

## Token changes (src/app/(marketing)/Home/foreigner/foreigner.css, `.fr`)

The token names were kept, so every page picks up the change from here.

| Token           | Role                                   | Before (green / yellow) | After (logo)         |
| --------------- | -------------------------------------- | ----------------------- | -------------------- |
| `--fr-cream`    | page and card background               | `#ece8d9`               | `#f5efe6` warm cream |
| `--fr-dark`     | borders, dark sections, dark buttons   | `#1c2c26` dark green    | `#141414` black      |
| `--fr-brown`    | text                                   | `#341210` brown         | `#221e1b` warm black |
| `--fr-yellow`   | main accent (button text, hover, tags) | `#ffff2b` yellow        | `#f26f39` logo orange |
| `--fr-yellow-50`| accent at 50%                          | `#ffff2b80`             | `#f26f3980`          |
| `--fr-lime`     | highlight panels, selected states      | `#d6e852` lime          | `#ffbf9b` peach      |
| `--fr-green`    | secondary (links, eyebrows, ticks)     | `#2f7f3c` green         | `#3c3f84` logo indigo |
| `--fr-line`     | menu line                              | `#1e5346`               | `#3c3f84`            |

Logo colours were sampled from `public/aapka-tourism-logo.png`: orange
`#F26F39` (sun and AAPKA), indigo `#3C3F84` (TOURISM).

## Other files changed

- `src/components/site/pdp/pdp-fr.css`: the package-page tokens that had
  their own hex copies of the old colours now derive from the `--fr-*`
  tokens with `color-mix()`.
- `src/components/site/styles/select.css` and
  `src/components/site/styles/contact-popover.css`: the fallback hex values
  now match the new palette.
- `src/app/(marketing)/Home/foreigner/FrHeader.tsx`: the header's scroll fade
  was a hard-coded green `rgba(28, 44, 38, …)`; it now uses `--fr-dark`.
- `src/app/(marketing)/Home/foreigner/FrReviews.tsx` + `foreigner.css`: the
  reviews-slider arrows were green images from the reference CDN; they are
  now inline SVGs in the palette (black arrow on orange, orange on black on
  hover).
- `foreigner.css`: the homepage marquee heading uses the orange accent
  (it was lime).

## Second round, same day: white text on orange, white background

- `--fr-cream` (page and card background) went from `#f5efe6` to `#ffffff`.
- New token `--fr-on-accent: #ffffff` is the text colour on full-orange
  backgrounds. Every rule that put black text on orange (buttons, tags,
  number boxes, the holidays Filters pill, hover states that turn orange,
  slider arrows, orange home cards, contact cards on hover, the checkout
  radio dot) now uses it. The contact popover has `--cp-on-accent`.
- The rolling hover text (`.fr-roll__bottom` in `foreigner.css`) now
  inherits its button's colour instead of always being black.
- The About reviews arrows hover to black (they hovered to lime).

Extra files backed up before this round, also as `.bak` here:
`about.css`, `become-agent.css`, `subscribe.css`, `checkout-fr.css`,
`contact-fr.css`, `holidays.css`, `enquiry-fr.css`. Restoring the whole
folder brings back the original green / yellow look with dark text on the
yellow accent.

## How to go back

Copy each `.bak` file over its original path, dropping the `.bak`. From the
project root (Git Bash):

```bash
cd backups/palette-green-yellow-2026-10-28 && find src -name "*.bak" | while read f; do cp "$f" "../../${f%.bak}"; done
```

Only these files are restored. Everything built after the backup (checkout,
contact, plan your trip, partner pages, dropdown, popover) uses the
`--fr-*` tokens, so it goes back to green / yellow with them.

To switch only the colours (and keep the arrow and header fixes), it is
enough to put the "Before" values back into the `.fr` block of
`foreigner.css`.
