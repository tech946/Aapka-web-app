# Backup: typography, header and listing cards, 2026-10-28

Taken before the new-design (`.fr`) pages moved off "everything in Bebas
Neue caps" to a two-font system, the header was rebuilt and the holiday
cards were changed to show full images.

## What changed

Fonts (tokens in the `.fr` block of `src/app/(marketing)/Home/foreigner/foreigner.css`):

| Token          | Before                         | After                                   |
| -------------- | ------------------------------ | --------------------------------------- |
| `--fr-display` | (new)                          | Bebas Neue: big display headlines only  |
| `--fr-heading` | Bebas Neue                     | Plus Jakarta Sans (the design-system font, `--font-site`) |
| `--fr-body`    | Barlow Semi Condensed          | Plus Jakarta Sans                       |
| `--fr-muted`   | (new)                          | grey text for meta lines                |

- Bebas stays only on page-level h1/h2 outside forms and on display text
  34px+ (hero "Explore the UAE", section titles, banners, big prices).
- Everything else that was Bebas (nav, buttons, card titles, pills, tags,
  labels, prices, form titles) is Plus Jakarta at ~74% of the old size,
  weight 600/700, normal letter-spacing, no forced uppercase, line-height
  1.25. Body text moved from Barlow to Plus Jakarta at ~89% of the old size,
  line-height 1.55–1.6. Small uppercase labels (eyebrows, "DAY 1", sidebar
  field names) were kept.
- Kalam (handwritten) is no longer used for card meta ("Anydate", "from");
  it stays only for "Scroll to explore".
- Package page: title 34px / section headings 26px / sub-headings 17px.
- Phones: form fields stay 16px so iOS doesn't zoom on focus.

Header (`FrHeader.tsx` + header block in `foreigner.css`): plain text links
with a soft pill hover and an orange active state, chevron dropdowns with a
small close delay, outside-click / Escape to close and arrow-key navigation,
an orange "Plan a trip" button (→ /travel-enquiry), and a slide-in mobile
menu card with a backdrop. "More" menu: Oman Visa, Oman Transport, FAQs,
About Us ("Submit Enquiry" became the Plan a trip button).

Holiday listing cards (`holidays.css`): image runs edge to edge at 6:5 (the
package images are 1127×944 or square, so nothing important is cropped),
title wraps to two lines instead of truncating, meta and "from" in grey
body text, rounded pills.

## How to go back

```bash
cd backups/typography-2026-10-28 && find src -name "*.bak" | while read f; do cp "$f" "../../${f%.bak}"; done
```

This restores all 18 files (13 stylesheets, `FrHeader.tsx`,
`HolidaysListing.tsx`, `tap.css`, `booking-wizard.css`, `Art.tsx`).

## Update, same day: Plus Jakarta reverted

The user preferred Bebas Neue as before. The 13 stylesheets were restored
from this folder (so Bebas / Barlow are back everywhere), and then only
these were re-applied on top:

- the new header CSS (pill links, chevron dropdowns, Plan a trip button,
  mobile menu card) but set in Bebas, 17px, weight 400 — `FrHeader.tsx`
  keeps the new markup;
- the full-image holiday cards (6:5, edge to edge, two-line Bebas titles);
- the phone rule keeping form fields at 16px.

Then Bebas text was made slightly smaller: sizes in Bebas rules ×0.9
(×0.93 for 34px and up), headline tokens `--fr-h1/h2/h3` ×0.9, default
paragraph 18 → 17px. Body text otherwise unchanged.

The Plus Jakarta version is kept in `backups/typography-pjs-2026-10-28/`
in case any part of it is wanted later.
